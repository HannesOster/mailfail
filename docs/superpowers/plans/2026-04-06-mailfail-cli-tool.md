# MailFail CLI Tool — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-04-06-mailfail-cli-tool-design.md`
**Date:** 2026-04-06

## Step 1: Extract SMTP logic to `packages/smtp`

**Goal:** Make SMTP core logic reusable by both SaaS and CLI.

**Files to create:**
- `packages/smtp/package.json` — package config, deps: `smtp-server`, `mailparser`
- `packages/smtp/tsconfig.json`
- `packages/smtp/src/index.ts` — re-exports
- `packages/smtp/src/parser.ts` — email stream parsing (extract from `apps/smtp/src/handler.ts`): raw stream → parsed email object (from, to, cc, bcc, subject, html, text, headers, attachments)
- `packages/smtp/src/types.ts` — `ParsedEmail`, `SmtpAuthResult`, `SmtpHandlerOptions` types

**Files to modify:**
- `apps/smtp/src/handler.ts` — import parser from `@mailfail/smtp` instead of inline parsing
- `apps/smtp/src/server.ts` — keep SaaS-specific auth (credential lookup) here
- Root `pnpm-workspace.yaml` — add `packages/smtp`

**Verification:** `apps/smtp` still works with `pnpm dev`. Existing tests pass.

---

## Step 2: Add SQLite dialect to `packages/db`

**Goal:** Dual-dialect support — Postgres for SaaS, SQLite for CLI.

**Files to create:**
- `packages/db/src/schema/sqlite/inboxes.ts` — SQLite inbox schema (text PKs, routeKey instead of smtpUser/smtpPass, no userId FK)
- `packages/db/src/schema/sqlite/emails.ts` — SQLite email schema (text for JSON columns)
- `packages/db/src/schema/sqlite/attachments.ts` — SQLite attachment schema
- `packages/db/src/schema/sqlite/validation-results.ts` — SQLite validation schema
- `packages/db/src/schema/sqlite/index.ts` — re-exports all SQLite schemas
- `packages/db/src/sqlite.ts` — `createSqliteDb(path)` factory using `better-sqlite3`

**Files to modify:**
- `packages/db/package.json` — add `better-sqlite3` + `@types/better-sqlite3` as optional peer deps
- `packages/db/src/queries/inboxes.ts` — make queries dialect-agnostic or add SQLite variants: add `getOrCreateInboxByRouteKey(routeKey)` for auto-routing
- `packages/db/src/queries/emails.ts` — ensure works with both dialects
- `packages/db/src/queries/validation.ts` — ensure works with both dialects
- `packages/db/src/queries/attachments.ts` — ensure works with both dialects
- `packages/db/src/index.ts` — export SQLite factory alongside Postgres

**Note:** Remove `userId` from all CLI queries — no users table. Queries that currently take `userId` need CLI variants that skip ownership checks.

**Verification:** Write a small test script that creates SQLite DB, runs all queries. Existing Postgres queries unaffected.

---

## Step 3: Scaffold `apps/cli` with CLI entry + Hono server

**Goal:** Basic CLI that starts SMTP + HTTP server with correct config.

**Files to create:**
- `apps/cli/package.json` — deps: `hono`, `@hono/node-server`, `better-sqlite3`, `smtp-server`, `commander`, `open` (for `--open`). bin entry.
- `apps/cli/tsconfig.json`
- `apps/cli/src/cli.ts` — arg parsing with `commander`, env var loading, orchestrates startup
- `apps/cli/src/config.ts` — config resolution (defaults → env → flags)
- `apps/cli/src/db.ts` — SQLite init, migrations, returns db instance
- `apps/cli/src/events.ts` — `EventEmitter` bus with typed events
- `apps/cli/src/storage.ts` — local attachment storage (save to `~/.mailfail/attachments/`)
- `apps/cli/src/smtp.ts` — local SMTP server: fixed `dev`/`dev` auth, uses `@mailfail/smtp` parser, auto-routing via To-address, emits events, stores attachments locally
- `apps/cli/src/server.ts` — Hono app setup, mounts API routes + static files

**Verification:** `pnpm --filter @mailfail/cli dev` starts both servers, startup message prints correctly, SMTP accepts connections with `dev`/`dev`.

---

## Step 4: Implement Hono API routes

**Goal:** All API endpoints working against SQLite.

**Files to create:**
- `apps/cli/src/routes/inboxes.ts` — GET/POST/DELETE inbox routes
- `apps/cli/src/routes/emails.ts` — GET/DELETE email routes, recheck route
- `apps/cli/src/routes/forward.ts` — POST forward (checks RESEND_API_KEY, 404 if missing)
- `apps/cli/src/routes/stream.ts` — SSE endpoint using EventEmitter

**Port logic from:**
- `apps/web/src/app/api/inboxes/route.ts` → `routes/inboxes.ts`
- `apps/web/src/app/api/inboxes/[id]/emails/route.ts` → `routes/emails.ts`
- `apps/web/src/app/api/inboxes/[id]/emails/[mailId]/route.ts` → `routes/emails.ts`
- `apps/web/src/app/api/inboxes/[id]/emails/[mailId]/forward/route.ts` → `routes/forward.ts`
- `apps/web/src/app/api/inboxes/[id]/emails/[mailId]/recheck/route.ts` → `routes/emails.ts`
- `apps/web/src/app/api/inboxes/[id]/stream/route.ts` → `routes/stream.ts`

**Key changes vs SaaS routes:**
- Remove all `requireAuthFromRequest()` calls
- Remove all limit checks
- Remove `userId` from query params
- Forward route: check `process.env.RESEND_API_KEY`, return 404 if not set

**Verification:** Use `curl` or `httpie` to test each endpoint against running CLI server. Send test email via SMTP, verify it appears via API.

---

## Step 5: Build Vite SPA (port frontend)

**Goal:** Working React SPA served by Hono.

**Files to create:**
- `apps/cli/ui/package.json` — deps: `react`, `react-dom`, `react-router-dom`, `lucide-react`, `tailwindcss`
- `apps/cli/ui/vite.config.ts` — build output to `../dist/ui/`
- `apps/cli/ui/index.html` — SPA shell
- `apps/cli/ui/src/main.tsx` — React entry, mounts router
- `apps/cli/ui/src/router.tsx` — React Router config
- `apps/cli/ui/src/globals.css` — Tailwind imports
- `apps/cli/ui/src/pages/inbox-list.tsx` — ported from `inbox-list-client.tsx`
- `apps/cli/ui/src/pages/inbox-detail.tsx` — ported from `inbox-detail-client.tsx` + `dashboard-client.tsx`
- `apps/cli/ui/src/pages/email-detail.tsx` — ported from `email-detail-client.tsx`
- `apps/cli/ui/src/components/sidebar-nav.tsx` — ported, remove auth UI
- `apps/cli/ui/src/components/theme-toggle.tsx` — ported as-is
- `apps/cli/ui/src/components/validation-result.tsx` — ported as-is
- `apps/cli/ui/src/components/welcome.tsx` — inline welcome message for empty state
- `apps/cli/ui/src/hooks/use-inbox-stream.ts` — EventSource hook (almost unchanged)
- `apps/cli/ui/src/lib/api.ts` — fetch wrapper for local API

**Key porting changes:**
- Replace `requireAuth()` / server-side data fetching with `fetch()` calls
- Replace Next.js `Link` / `useRouter` with React Router equivalents
- Remove Clerk components (UserButton, SignIn, etc.)
- Remove HTML-check navigation links
- Remove settings navigation
- Add welcome component for empty inbox state

**Verification:** `pnpm --filter @mailfail/cli build:ui` produces working SPA. Hono serves it. All pages render, navigation works, real-time updates work.

---

## Step 6: Build pipeline + npm package preparation

**Goal:** Single `npm publish`-ready package.

**Files to create:**
- `apps/cli/tsup.config.ts` — bundles server code to `dist/cli.js` (single file, all deps bundled except native modules)
- `apps/cli/scripts/build.sh` — orchestrates: build UI (vite) → build server (tsup) → copy UI dist into server dist

**Files to modify:**
- `apps/cli/package.json` — add build scripts, files array (`dist/`), bin entry, engines (node >= 18)

**Build output:**
```
apps/cli/dist/
├── cli.js          # Bundled server entry
└── ui/             # Built SPA
    ├── index.html
    └── assets/
```

**Verification:**
1. `pnpm --filter @mailfail/cli build` produces dist
2. `node apps/cli/dist/cli.js` starts correctly
3. Test `npm pack` and install globally from tarball

---

## Step 7: End-to-end testing + polish

**Goal:** Everything works together smoothly.

**Test scenarios:**
1. `npx mailfail` starts with default config
2. Send email via SMTP (e.g., `swaks --to shop@test.local --server localhost:2525 --au dev --ap dev`)
3. Inbox "shop" auto-created, email appears in UI in real-time
4. Email validation results show (links, HTML, spam, etc.)
5. Send another email to different address → new inbox appears
6. Delete email via UI
7. Delete inbox via UI
8. `--smtp-port`, `--ui-port`, `--dir` flags work
9. `--no-ui` starts only SMTP
10. `--open` opens browser
11. `MAILFAIL_SMTP_PORT` env var works
12. Forward works when `RESEND_API_KEY` is set, 404 when not
13. Attachments saved and viewable
14. Restart preserves data (SQLite persistence)

**Polish:**
- Graceful shutdown (SIGINT/SIGTERM) — close SMTP + HTTP servers
- Port-in-use error handling with clear message
- Colored terminal output for startup message

**Verification:** All 14 test scenarios pass manually.

---

## Summary

| Step | Description | Depends on |
|------|-------------|-----------|
| 1 | Extract SMTP to package | — |
| 2 | SQLite dialect for db | — |
| 3 | CLI scaffold + servers | 1, 2 |
| 4 | Hono API routes | 3 |
| 5 | Vite SPA frontend | 4 |
| 6 | Build pipeline + packaging | 4, 5 |
| 7 | E2E testing + polish | 6 |

Steps 1 and 2 can run in parallel. Steps 3-7 are sequential.
