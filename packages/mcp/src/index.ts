#!/usr/bin/env npx tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const MAILFAIL_API_URL = process.env.MAILFAIL_API_URL ?? "http://localhost:3333";
const MAILFAIL_API_KEY = process.env.MAILFAIL_API_KEY ?? "";

async function api(path: string) {
  const res = await fetch(`${MAILFAIL_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${MAILFAIL_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`MailFail API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

const server = new McpServer({
  name: "mailfail",
  version: "0.1.0",
});

server.tool(
  "list_inboxes",
  "List all MailFail inboxes with their IDs, names, and SMTP credentials",
  {},
  async () => {
    const inboxes = await api("/api/inboxes");
    return {
      content: [{ type: "text", text: JSON.stringify(inboxes, null, 2) }],
    };
  },
);

server.tool(
  "get_smtp_credentials",
  "Get SMTP credentials for a specific inbox, ready to paste into .env files",
  { inboxId: z.string().describe("The inbox ID") },
  async ({ inboxId }) => {
    const inboxes = await api("/api/inboxes");
    const inbox = inboxes.find((i: any) => i.id === inboxId);
    if (!inbox) {
      return { content: [{ type: "text", text: `Inbox ${inboxId} not found` }] };
    }
    const smtpHost = MAILFAIL_API_URL.includes("localhost") ? "localhost" : "smtp.mailfail.dev";
    const creds = `SMTP_HOST=${smtpHost}\nSMTP_PORT=2525\nSMTP_USER=${inbox.smtpUser}\nSMTP_PASS=${inbox.smtpPass}`;
    return { content: [{ type: "text", text: creds }] };
  },
);

server.tool(
  "list_emails",
  "List recent emails in a MailFail inbox (subject, from, date, read status)",
  {
    inboxId: z.string().describe("The inbox ID"),
    limit: z.number().optional().default(20).describe("Max emails to return"),
  },
  async ({ inboxId, limit }) => {
    const emails = await api(`/api/inboxes/${inboxId}/emails?limit=${limit}`);
    const summary = emails.map((e: any) => ({
      id: e.id,
      from: e.from,
      subject: e.subject,
      date: e.createdAt,
      read: e.isRead,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    };
  },
);

server.tool(
  "read_email",
  "Read a specific email's full content including headers, body, and validation results",
  {
    inboxId: z.string().describe("The inbox ID"),
    emailId: z.string().describe("The email ID"),
  },
  async ({ inboxId, emailId }) => {
    const email = await api(`/api/inboxes/${inboxId}/emails/${emailId}`);
    return {
      content: [{ type: "text", text: JSON.stringify(email, null, 2) }],
    };
  },
);

function extractLinks(html: string): string[] {
  const urls: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (url.startsWith("http://") || url.startsWith("https://")) {
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

server.tool(
  "check_email_links",
  "Extract all links from an email and check if they resolve (returns status code for each link)",
  {
    inboxId: z.string().describe("The inbox ID"),
    emailId: z.string().describe("The email ID"),
  },
  async ({ inboxId, emailId }) => {
    const email = await api(`/api/inboxes/${inboxId}/emails/${emailId}`);
    const html = email.html ?? email.body ?? "";
    const links = extractLinks(html);

    if (links.length === 0) {
      return { content: [{ type: "text", text: "No links found in this email." }] };
    }

    const results = await Promise.all(
      links.map(async (url) => {
        try {
          const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(5000) });
          return { url, status: res.status, ok: res.ok };
        } catch (err: any) {
          return { url, status: 0, ok: false, error: err.message };
        }
      }),
    );

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
