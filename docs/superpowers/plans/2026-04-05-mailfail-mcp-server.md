# MailFail MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MCP server so Claude can check if emails arrived in MailFail and retrieve SMTP credentials for any inbox.

**Architecture:** Activate API key auth on existing routes, then build a lightweight MCP server package (`packages/mcp`) that wraps the MailFail HTTP API. The MCP server exposes 5 tools: `list_inboxes`, `get_smtp_credentials`, `list_emails`, `read_email`, `check_email_links`.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, Node.js

---

### Task 1: Activate API Key Auth on API Routes

The `requireAuthFromRequest()` function already exists in `apps/web/src/lib/auth.ts` and supports `Bearer mf_*` tokens. Currently no route uses it. We need to switch the routes relevant for the MCP server to use it.

**Files:**
- Modify: `apps/web/src/app/api/inboxes/route.ts` (GET handler only)
- Modify: `apps/web/src/app/api/inboxes/[id]/emails/route.ts` (GET handler only)
- Modify: `apps/web/src/app/api/inboxes/[id]/emails/[mailId]/route.ts` (GET handler only)

**Note:** `requireAuthFromRequest()` needs the `Request` object. For handlers that currently ignore `request` (using `_request`), we need to use the parameter. Also, `requireAuthFromRequest()` does NOT auto-create an inbox (it returns `{ clerkUserId, user }` without `inbox`), so the routes must not depend on `inbox` from auth — which they don't, they fetch inboxes explicitly.

- [ ] **Step 1: Update GET /api/inboxes**

In `apps/web/src/app/api/inboxes/route.ts`, change the import and GET handler:

```typescript
// Change import
import { requireAuth, requireAuthFromRequest } from "@/lib/auth";

// Change GET handler to accept request and use requireAuthFromRequest
export async function GET(request: Request) {
  const { user } = await requireAuthFromRequest(request);
  const inboxes = await listInboxes(db, user.id);
  return NextResponse.json(inboxes);
}
```

POST stays with `requireAuth()` (no need for API key access to create inboxes).

- [ ] **Step 2: Update GET /api/inboxes/[id]/emails**

In `apps/web/src/app/api/inboxes/[id]/emails/route.ts`, change the GET handler:

```typescript
import { requireAuth, requireAuthFromRequest } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await requireAuthFromRequest(request);
  const { id } = await params;
  // rest stays the same
```

DELETE stays with `requireAuth()`.

- [ ] **Step 3: Update GET /api/inboxes/[id]/emails/[mailId]**

In `apps/web/src/app/api/inboxes/[id]/emails/[mailId]/route.ts`, change the GET handler:

```typescript
import { requireAuth, requireAuthFromRequest } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; mailId: string }> },
) {
  const { user } = await requireAuthFromRequest(request);
  const { id, mailId } = await params;
  // rest stays the same
```

DELETE stays with `requireAuth()`.

- [ ] **Step 4: Test API key auth manually**

Start the dev server, generate an API key in Settings, then test:

```bash
# Should return inbox list
curl -H "Authorization: Bearer mf_<your-key>" http://localhost:3333/api/inboxes
```

Expected: JSON array of inboxes (not a 401).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/inboxes/route.ts apps/web/src/app/api/inboxes/\[id\]/emails/route.ts apps/web/src/app/api/inboxes/\[id\]/emails/\[mailId\]/route.ts
git commit -m "feat: activate API key auth on inbox and email GET routes"
```

---

### Task 2: Create MCP Server Package

Create `packages/mcp` — a standalone MCP server that connects to the MailFail API using an API key.

**Files:**
- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `packages/mcp/src/index.ts`

- [ ] **Step 1: Create package.json**

Create `packages/mcp/package.json`:

```json
{
  "name": "@mailfail/mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "bin": {
    "mailfail-mcp": "./src/index.ts"
  },
  "scripts": {
    "start": "npx tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12",
    "tsx": "^4"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `packages/mcp/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create the MCP server**

Create `packages/mcp/src/index.ts`:

```typescript
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
```

- [ ] **Step 4: Install dependencies**

```bash
cd /Users/johannesosterkamp/Projects/mailfail && pnpm install
```

- [ ] **Step 5: Test the MCP server starts**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' | MAILFAIL_API_KEY=test npx tsx packages/mcp/src/index.ts
```

Expected: JSON response with server info and tool list.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp/
git commit -m "feat: add MailFail MCP server with inbox, email, and SMTP credential tools"
```

---

### Task 3: Configure MCP Server in Claude Code Settings

Add the MCP server to the project's Claude Code settings so it's available in every session.

**Files:**
- Create or modify: `.mcp.json` in project root

- [ ] **Step 1: Create .mcp.json**

Create `/Users/johannesosterkamp/Projects/mailfail/.mcp.json`:

```json
{
  "mcpServers": {
    "mailfail": {
      "command": "npx",
      "args": ["tsx", "packages/mcp/src/index.ts"],
      "cwd": "/Users/johannesosterkamp/Projects/mailfail",
      "env": {
        "MAILFAIL_API_URL": "http://localhost:3333",
        "MAILFAIL_API_KEY": "<REPLACE_WITH_YOUR_API_KEY>"
      }
    }
  }
}
```

**Important:** The user needs to generate an API key in MailFail Settings and replace the placeholder. `.mcp.json` should be in `.gitignore` since it contains the API key.

- [ ] **Step 2: Add .mcp.json to .gitignore**

Append to `.gitignore`:

```
.mcp.json
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add .mcp.json to gitignore"
```

---

### Task 4: End-to-End Verification

- [ ] **Step 1: Start MailFail dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Generate API key**

Go to `http://localhost:3333/dashboard/settings` and generate an API key. Copy it.

- [ ] **Step 3: Update .mcp.json with the real API key**

Replace `<REPLACE_WITH_YOUR_API_KEY>` in `.mcp.json` with the actual key.

- [ ] **Step 4: Restart Claude Code session**

Exit and re-enter the project directory so the MCP server starts.

- [ ] **Step 5: Test tools**

Ask Claude to:
1. "List my MailFail inboxes" — should show inboxes
2. "Get SMTP credentials for inbox X" — should return env-format credentials
3. Send a test email to the SMTP server, then "Check if a new email arrived in inbox X"
