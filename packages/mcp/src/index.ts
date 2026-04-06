#!/usr/bin/env npx tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const MAILFAIL_API_URL =
  process.env.MAILFAIL_API_URL ?? "http://localhost:3333";
const MAILFAIL_API_KEY = process.env.MAILFAIL_API_KEY ?? "";
const MAILFAIL_SMTP_HOST =
  process.env.MAILFAIL_SMTP_HOST ??
  (MAILFAIL_API_URL.includes("localhost") ? "localhost" : "smtp.mailfail.dev");

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function api(
  path: string,
  options?: { method?: string; body?: unknown },
) {
  const res = await fetch(`${MAILFAIL_API_URL}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${MAILFAIL_API_KEY}`,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try {
      message = JSON.parse(text).error ?? text;
    } catch {
      message = text;
    }
    throw new Error(`MailFail API ${res.status}: ${message}`);
  }
  return res.json();
}

function text(value: unknown) {
  return {
    content: [
      { type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) },
    ],
  };
}

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

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "mailfail",
  version: "0.2.0",
});

// ---------------------------------------------------------------------------
// list_inboxes
// ---------------------------------------------------------------------------

server.tool(
  "list_inboxes",
  "List all MailFail inboxes with their IDs, names, and email counts",
  {},
  async () => {
    const inboxes = await api("/api/inboxes");
    const summary = inboxes.map((i: any) => ({
      id: i.id,
      name: i.name,
      smtpUser: i.smtpUser,
      monthlyMailCount: i.monthlyMailCount,
      createdAt: i.createdAt,
    }));
    return text(summary);
  },
);

// ---------------------------------------------------------------------------
// create_inbox
// ---------------------------------------------------------------------------

server.tool(
  "create_inbox",
  "Create a new MailFail inbox and return its ID and SMTP credentials",
  { name: z.string().describe("Name for the new inbox") },
  async ({ name }) => {
    const inbox = await api("/api/inboxes", {
      method: "POST",
      body: { name },
    });
    const creds = [
      `SMTP_HOST=${MAILFAIL_SMTP_HOST}`,
      `SMTP_PORT=2525`,
      `SMTP_USER=${inbox.smtpUser}`,
      `SMTP_PASS=${inbox.smtpPass}`,
    ].join("\n");
    return text({ id: inbox.id, name: inbox.name, credentials: creds });
  },
);

// ---------------------------------------------------------------------------
// get_smtp_credentials
// ---------------------------------------------------------------------------

server.tool(
  "get_smtp_credentials",
  "Get SMTP credentials for a specific inbox, ready to paste into .env files",
  { inboxId: z.string().describe("The inbox ID") },
  async ({ inboxId }) => {
    const inboxes = await api("/api/inboxes");
    const inbox = inboxes.find((i: any) => i.id === inboxId);
    if (!inbox) {
      return text(`Inbox ${inboxId} not found`);
    }
    const creds = [
      `SMTP_HOST=${MAILFAIL_SMTP_HOST}`,
      `SMTP_PORT=2525`,
      `SMTP_USER=${inbox.smtpUser}`,
      `SMTP_PASS=${inbox.smtpPass}`,
    ].join("\n");
    return text(creds);
  },
);

// ---------------------------------------------------------------------------
// list_emails
// ---------------------------------------------------------------------------

server.tool(
  "list_emails",
  "List recent emails in a MailFail inbox (subject, from, date, read status)",
  {
    inboxId: z.string().describe("The inbox ID"),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Max emails to return"),
  },
  async ({ inboxId, limit }) => {
    const emails = await api(
      `/api/inboxes/${inboxId}/emails?limit=${limit}`,
    );
    const summary = emails.map((e: any) => ({
      id: e.id,
      from: e.from,
      subject: e.subject,
      date: e.createdAt,
      read: e.isRead,
    }));
    return text(summary);
  },
);

// ---------------------------------------------------------------------------
// read_email
// ---------------------------------------------------------------------------

server.tool(
  "read_email",
  "Read a specific email's full content including headers, body, and validation results",
  {
    inboxId: z.string().describe("The inbox ID"),
    emailId: z.string().describe("The email ID"),
  },
  async ({ inboxId, emailId }) => {
    const email = await api(
      `/api/inboxes/${inboxId}/emails/${emailId}`,
    );
    return text(email);
  },
);

// ---------------------------------------------------------------------------
// get_email_validation
// ---------------------------------------------------------------------------

server.tool(
  "get_email_validation",
  "Get only the validation results for an email: spam score, link checks, image checks, compatibility issues, accessibility issues, and overall score",
  {
    inboxId: z.string().describe("The inbox ID"),
    emailId: z.string().describe("The email ID"),
  },
  async ({ inboxId, emailId }) => {
    const email = await api(
      `/api/inboxes/${inboxId}/emails/${emailId}`,
    );
    if (!email.validation) {
      return text("No validation results available for this email.");
    }
    return text({
      overallScore: email.validation.overallScore,
      spamScore: email.validation.spamScore,
      linkChecks: email.validation.linkChecks,
      imageChecks: email.validation.imageChecks,
      compatIssues: email.validation.compatIssues,
      a11yIssues: email.validation.a11yIssues,
      htmlIssues: email.validation.htmlIssues,
      checkedAt: email.validation.checkedAt,
    });
  },
);

// ---------------------------------------------------------------------------
// check_email_links
// ---------------------------------------------------------------------------

const LINK_CHECK_CONCURRENCY = 5;

server.tool(
  "check_email_links",
  "Extract all links from an email and check if they resolve (returns status code for each link)",
  {
    inboxId: z.string().describe("The inbox ID"),
    emailId: z.string().describe("The email ID"),
  },
  async ({ inboxId, emailId }) => {
    const email = await api(
      `/api/inboxes/${inboxId}/emails/${emailId}`,
    );
    const html = email.htmlBody ?? email.textBody ?? "";
    const links = extractLinks(html);

    if (links.length === 0) {
      return text("No links found in this email.");
    }

    // Check links in batches to avoid overwhelming targets
    const results: { url: string; status: number; ok: boolean; error?: string }[] = [];
    for (let i = 0; i < links.length; i += LINK_CHECK_CONCURRENCY) {
      const batch = links.slice(i, i + LINK_CHECK_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (url) => {
          try {
            const res = await fetch(url, {
              method: "HEAD",
              redirect: "follow",
              signal: AbortSignal.timeout(5000),
            });
            return { url, status: res.status, ok: res.ok };
          } catch (err: any) {
            return { url, status: 0, ok: false, error: err.message };
          }
        }),
      );
      results.push(...batchResults);
    }

    return text(results);
  },
);

// ---------------------------------------------------------------------------
// delete_email
// ---------------------------------------------------------------------------

server.tool(
  "delete_email",
  "Delete a specific email from an inbox",
  {
    inboxId: z.string().describe("The inbox ID"),
    emailId: z.string().describe("The email ID"),
  },
  async ({ inboxId, emailId }) => {
    await api(`/api/inboxes/${inboxId}/emails/${emailId}`, {
      method: "DELETE",
    });
    return text(`Email ${emailId} deleted.`);
  },
);

// ---------------------------------------------------------------------------
// clear_inbox
// ---------------------------------------------------------------------------

server.tool(
  "clear_inbox",
  "Delete all emails in an inbox",
  { inboxId: z.string().describe("The inbox ID") },
  async ({ inboxId }) => {
    await api(`/api/inboxes/${inboxId}/emails`, { method: "DELETE" });
    return text(`All emails in inbox ${inboxId} deleted.`);
  },
);

// ---------------------------------------------------------------------------
// recheck_email
// ---------------------------------------------------------------------------

server.tool(
  "recheck_email",
  "Re-run the full validation pipeline (spam, links, images, compat, a11y) on an email",
  {
    inboxId: z.string().describe("The inbox ID"),
    emailId: z.string().describe("The email ID"),
  },
  async ({ inboxId, emailId }) => {
    const validation = await api(
      `/api/inboxes/${inboxId}/emails/${emailId}/recheck`,
      { method: "POST" },
    );
    return text(validation);
  },
);

// ---------------------------------------------------------------------------
// forward_email
// ---------------------------------------------------------------------------

server.tool(
  "forward_email",
  "Forward an email to a real email address (for testing rendering in actual email clients)",
  {
    inboxId: z.string().describe("The inbox ID"),
    emailId: z.string().describe("The email ID"),
    to: z.string().describe("Destination email address"),
  },
  async ({ inboxId, emailId, to }) => {
    await api(`/api/inboxes/${inboxId}/emails/${emailId}/forward`, {
      method: "POST",
      body: { to },
    });
    return text(`Email forwarded to ${to}.`);
  },
);

// ---------------------------------------------------------------------------
// wait_for_email
// ---------------------------------------------------------------------------

server.tool(
  "wait_for_email",
  "Wait for a new email to arrive in an inbox. Polls until a new email matching the optional filter appears or timeout is reached. Returns the new email.",
  {
    inboxId: z.string().describe("The inbox ID"),
    subject: z
      .string()
      .optional()
      .describe("Filter: only match emails whose subject contains this string (case-insensitive)"),
    from: z
      .string()
      .optional()
      .describe("Filter: only match emails whose from address contains this string (case-insensitive)"),
    timeoutSeconds: z
      .number()
      .optional()
      .default(30)
      .describe("Max seconds to wait (default 30, max 120)"),
  },
  async ({ inboxId, subject, from, timeoutSeconds }) => {
    const timeout = Math.min(timeoutSeconds, 120) * 1000;
    const pollInterval = 2000;
    const startTime = Date.now();

    // Collect IDs of all existing emails so we can detect truly new ones
    const existing = await api(
      `/api/inboxes/${inboxId}/emails?limit=50`,
    );
    const knownIds = new Set(existing.map((e: any) => e.id));

    while (Date.now() - startTime < timeout) {
      await new Promise((r) => setTimeout(r, pollInterval));

      const emails = await api(
        `/api/inboxes/${inboxId}/emails?limit=10`,
      );

      // Find emails we haven't seen before
      const newEmails = emails.filter((e: any) => !knownIds.has(e.id));

      if (newEmails.length === 0) continue;

      // Apply filters
      for (const email of newEmails) {
        const matchSubject =
          !subject ||
          (email.subject ?? "")
            .toLowerCase()
            .includes(subject.toLowerCase());
        const matchFrom =
          !from ||
          (email.from ?? "").toLowerCase().includes(from.toLowerCase());

        if (matchSubject && matchFrom) {
          // Fetch the full email
          const full = await api(
            `/api/inboxes/${inboxId}/emails/${email.id}`,
          );
          return text(full);
        }

        // Track this email so we don't match it again
        knownIds.add(email.id);
      }
    }

    return text(
      `Timeout after ${timeoutSeconds}s — no matching email arrived.`,
    );
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
