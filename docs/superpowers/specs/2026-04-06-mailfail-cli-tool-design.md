# MailFail CLI Tool — Design Spec

**Date:** 2026-04-06
**Status:** Approved

## Overview

Transform MailFail from a SaaS-only product into a locally installable CLI tool (`npx mailfail`) that developers can run to catch and validate emails during development. The SaaS web app continues to exist alongside the CLI tool in the same monorepo.

## Goals

- Zero-config email catching: `npx mailfail` and go
- Fixed SMTP credentials (`dev`/`dev`) — configure once, use forever
- Built-in email validation (links, HTML, spam, a11y, compatibility) — the killer feature vs Mailpit/Mailhog
- Auto-routing emails into inboxes based on To-address
- No external services required (SQLite, local filesystem, in-process events)

## Non-Goals

- Multi-user / auth
- HTML-Check standalone feature (SaaS-only)
- Billing / limits
- MCP server integration for CLI

## Monorepo Structure

```
apps/
├── web/              # SaaS (unchanged)
├── cli/              # NEW: CLI tool
│   ├── src/
│   │   ├── cli.ts          # Entry: arg parsing, startup
│   │   ├── server.ts       # Hono HTTP Server + API Routes
│   │   ├── smtp.ts         # Local SMTP Server
│   │   ├── events.ts       # EventEmitter (replaces Redis)
│   │   ├── db.ts           # SQLite setup + migrations
│   │   ├── storage.ts      # Local attachment storage
│   │   └── routes/         # Hono API Routes
│   ├── ui/                 # Vite SPA (ported React components)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── router.tsx
│   │   │   ├── pages/
│   │   │   └── components/
│   │   └── vite.config.ts
│   ├── package.json        # bin: { "mailfail": "./dist/cli.js" }
│   └── tsconfig.json
packages/
├── db/               # Drizzle Schema + Queries (dual-dialect: PG + SQLite)
├── shared/           # Types, Constants (shared)
├── validation/       # Pipeline (shared, unchanged)
├── smtp/             # NEW: extracted from apps/smtp (shared SMTP logic)
└── mcp/              # MCP Server (SaaS-only)
```

Key refactor: `apps/smtp` core logic moves to `packages/smtp` so both SaaS and CLI can reuse email parsing, header extraction, and handler logic.

## CLI Configuration

**Priority** (low → high): Defaults → Env Vars → CLI Flags

| Flag | Env Var | Default | Description |
|------|---------|---------|-------------|
| `--smtp-port` | `MAILFAIL_SMTP_PORT` | `2525` | SMTP port |
| `--ui-port` | `MAILFAIL_UI_PORT` | `3333` | Web UI port |
| `--dir` | `MAILFAIL_DIR` | `~/.mailfail` | Data directory |
| `--open` | — | `false` | Open browser on start |
| `--no-ui` | — | `false` | SMTP only, no web server |

**Optional env var:** `RESEND_API_KEY` — enables email forwarding when set.

**Fixed SMTP credentials:** `dev` / `dev` (hardcoded, no rotation).

## Startup Flow

1. Parse args + env vars
2. Create data directory (`~/.mailfail/`) if needed
3. Initialize SQLite DB + run migrations
4. Start SMTP server
5. Start Hono HTTP server (API + SPA static files)
6. Print startup message
7. Optionally open browser (`--open`)

**Startup output:**
```
 MailFail v1.0.0

 SMTP  → localhost:2525
 UI    → http://localhost:3333
 Data  → ~/.mailfail/

 SMTP_HOST=localhost
 SMTP_PORT=2525
 SMTP_USER=dev
 SMTP_PASS=dev

 Ready to catch emails!
```

## Database (SQLite)

**Driver:** `better-sqlite3` via Drizzle ORM

**Type mappings from Postgres:**

| Postgres | SQLite |
|---|---|
| `uuid` | `text` + `crypto.randomUUID()` |
| `jsonb` | `text` + JSON.stringify/parse |
| `timestamp with timezone` | `text` (ISO-8601) |

**Tables:**

| Table | Changes vs SaaS |
|---|---|
| `inboxes` | No `smtpUser`/`smtpPass`, add `routeKey` (from To-address) |
| `emails` | Unchanged |
| `attachments` | `storagePath` = local file path |
| `validationResults` | Unchanged |
| `users` | Removed (single-user) |
| `htmlChecks` | Removed (not in CLI) |

**Data directory:**
```
~/.mailfail/
├── data.db
└── attachments/
    └── {emailId}/
        └── {filename}
```

## Inbox Auto-Routing

Fixed SMTP credentials for all inboxes. Routing based on To-address:

1. Parse `To` header → extract local-part (e.g., `shop` from `shop@whatever.com`)
2. Look up inbox with `routeKey = "shop"`
3. If not found → auto-create inbox `{ name: "shop", routeKey: "shop" }`
4. Store email in that inbox

Default inbox `"catchall"` for emails without clear routing (multiple recipients, empty To).

## API Routes (Hono)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/inboxes` | List all inboxes |
| `POST` | `/api/inboxes` | Create inbox manually |
| `GET` | `/api/inboxes/:id` | Inbox details |
| `DELETE` | `/api/inboxes/:id` | Delete inbox |
| `GET` | `/api/inboxes/:id/emails` | List emails in inbox |
| `GET` | `/api/inboxes/:id/emails/:mailId` | Email detail + validation |
| `DELETE` | `/api/inboxes/:id/emails/:mailId` | Delete email |
| `POST` | `/api/inboxes/:id/emails/:mailId/forward` | Forward (only if RESEND_API_KEY set) |
| `POST` | `/api/inboxes/:id/emails/:mailId/recheck` | Re-run validation |
| `GET` | `/api/inboxes/:id/stream` | SSE for new emails |
| `GET` | `/*` | Serve SPA (static files, fallback to index.html) |

No auth middleware. No limit checks. Forward route returns 404 if no RESEND_API_KEY.

## Real-Time (EventEmitter)

Replaces Redis Pub/Sub. Everything runs in one process:

```
SMTP handler → bus.emit("new-email", { inboxId, emailId })
                       ↓
SSE endpoint → bus.on("new-email", ...) → stream to browser
```

~10 lines of code, zero dependencies.

## Frontend (Vite SPA)

**Ported from apps/web:**
- `dashboard-client.tsx` → Email list + validations
- `inbox-detail-client.tsx` → Inbox view
- `inbox-list-client.tsx` → Inbox overview (start page)
- `email-detail-client.tsx` → Email detail with validation
- `sidebar-nav.tsx` → Navigation
- `theme-toggle.tsx` → Dark/Light mode
- `validation-result.tsx` → Validation display

**Removed:**
- Landing page, sign-in/sign-up, settings, HTML-check pages
- Clerk provider & auth wrappers
- Server components (everything becomes client)

**Routing (React Router):**
```
/                    → Redirect to /inboxes
/inboxes             → Inbox list (start page)
/inboxes/:id         → Inbox detail (email list)
/inboxes/:id/:mailId → Email detail + validation
```

**Welcome state:** When no inboxes exist, show inline welcome message with SMTP credentials and usage hint. Disappears after first email arrives.

**Data fetching:** All server-side fetching replaced with `fetch()` against local Hono API.

**Build:** Vite builds SPA to `apps/cli/dist/ui/`, Hono serves as static files with SPA fallback.

## Package Distribution

```json
{
  "name": "mailfail",
  "bin": { "mailfail": "./dist/cli.js" },
  "files": ["dist/"]
}
```

- `npm install -g mailfail` or `npx mailfail`
- `dist/` contains compiled server + built SPA
- Pre-built: no compilation needed at install time

## Shared Code Strategy

| Package | Used by SaaS | Used by CLI |
|---|---|---|
| `packages/shared` | Yes | Yes |
| `packages/validation` | Yes | Yes |
| `packages/db` | Yes (Postgres) | Yes (SQLite) |
| `packages/smtp` | Yes | Yes |
| `packages/mcp` | Yes | No |
