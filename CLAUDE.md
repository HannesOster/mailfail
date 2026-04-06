# MailFail

Email testing/catching SaaS — self-hosted Mailtrap alternative.

## Monorepo Structure

- `apps/web` — Next.js 16 (React 19, App Router) on port 3333
- `apps/smtp` — Node.js SMTP server on port 2525
- `packages/db` — Drizzle ORM, PostgreSQL (Neon), typed query layer
- `packages/shared` — Types, constants, validation configs
- `packages/validation` — Email validation pipeline (links, images, spam, HTML, a11y, compatibility)

## Running Locally

```bash
mailfail          # Global CLI command — starts web (3333) + smtp (2525)
pnpm dev          # Alternative: turbo dev for both apps
```

## Key Conventions

### Query Layer Pattern

All database access goes through `packages/db/src/queries/`. Never import Drizzle directly in API routes.

```typescript
// packages/db/src/queries/inboxes.ts
export async function listInboxes(db: Database, userId: string) { ... }
```

### Authentication

- `requireAuth()` — server components/actions, auto-creates user + default inbox on first login
- `requireAuthFromRequest(request)` — API routes, supports bearer token (`Bearer mf_<key>`)
- `isOwnerUser(db, clerkUserId)` — checks `OWNER_ORG_ID`, bypasses all limits

### SMTP Credentials Display

Copy-text format for SMTP credentials must always be:
```
SMTP_HOST=<host>
SMTP_PORT=2525
SMTP_USER=<smtpUser>
SMTP_PASS=<smtpPass>
```
Local fallback for `SMTP_HOST` is `localhost`, production uses `smtp.mailfail.dev`.

### API Routes

- `export const dynamic = "force-dynamic"` on auth-required pages
- Status codes: 401 (auth), 403 (limits), 400 (validation), 200/201 (success)

### Billing

- `BILLING_ENABLED = false` — disables all limit checks
- Free plan limits: 1 inbox, 100 emails/month, 20 HTML checks/month

## Tech Stack

- **Auth:** Clerk
- **DB:** PostgreSQL (Neon) via Drizzle ORM
- **Cache:** Upstash Redis
- **Storage:** Vercel Blob (attachments)
- **Email sending:** Resend
- **Styling:** Tailwind CSS 4
- **Package manager:** pnpm 9 with Turborepo
