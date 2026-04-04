# MailFail v2 Improvements — Design Spec

## 1. Simplified Auth (No Organizations)

Replace Clerk Organizations with direct user-scoped data.

**DB Changes:**
- `organizations` table → `users` table: `id`, `clerkUserId` (unique), `email`, `name`, `isOwner`, `createdAt`
- All FKs `organizationId` → `userId` (referencing `users.id`)
- Add `apiKey` field to `users` table (nullable, for API access)

**Auth Flow:**
- Landing → "Get Started" → Clerk Sign-In (Google + GitHub social login)
- After login → redirect to `/dashboard` (no org selection)
- `requireAuth()` replaces `requireOrg()` — returns `{ userId, user }` using Clerk `userId`
- Auto-create user record on first login

**Clerk Config (manual in clerk.com):**
- Enable Google + GitHub under Social Connections
- Remove Organizations feature

## 2. Auto-Validation on Mail Receipt

In `apps/smtp/src/handler.ts`, after storing the email:
1. Call validation pipeline
2. Store result
3. Push SSE event with `type: "validation-complete"`

Import validation functions from web app's `lib/validation/` — move validation to `packages/shared` or keep in web and call via internal HTTP. Simplest: duplicate the pipeline in a `packages/validation/` package shared by both apps.

## 3. Delete All Mails Button

Add "Delete All" button in inbox detail header. Calls `DELETE /api/inboxes/[id]/emails`.

## 4. Attachment Handling

In SMTP handler:
- Extract `parsed.attachments` from mailparser
- Upload each to Vercel Blob via `@vercel/blob`
- Store `attachments` records in DB

In email detail:
- "Attachments" tab shows list with filename, size, download link

## 5. Email Forwarding

In email detail, "Forward" button:
- Dialog: enter destination email
- Server action calls Resend API (`resend` npm package, free tier 100/day)
- Sends the original HTML + attachments to the real address

Env var: `RESEND_API_KEY`

## 6. Dark Mode

- Add dark mode toggle in dashboard header
- Use Tailwind `dark:` classes
- Store preference in localStorage
- Near-black sidebar already works, main content gets dark variants

## 7. Dynamic SMTP Host

- New env var: `NEXT_PUBLIC_SMTP_HOST` (defaults to `localhost`)
- All credential displays use this instead of hardcoded `localhost`

## 8. Webhook Notifications

- Add `webhookUrl` (nullable) to `inboxes` table
- Settings in inbox card: "Webhook URL" input
- SMTP handler: POST to webhook URL after storing email (fire-and-forget)
- Payload: `{ event: "new-email", emailId, inboxId, from, subject, receivedAt }`

## 9. Rate Limiting

- In-memory Map in SMTP server: `Map<inboxId, { count: number, resetAt: number }>`
- Check before processing: if count > `SMTP_CONFIG.maxRatePerSecond`, reject with 421

## 10. Error Handling in SMTP

- Wrap DB calls in try/catch
- Log errors, return SMTP error codes gracefully
- Don't crash the process on transient DB failures

## 11. Tests

- `packages/validation/` (or `apps/web/src/lib/validation/`) unit tests with vitest
- Test each check function with sample HTML
- Test score calculation

## 12. Better SSE

- Replace `lpop` polling with proper Redis Pub/Sub
- SMTP handler uses `redis.publish()` (already does)
- SSE endpoint uses Upstash REST-based subscription or sticks with polling but at 500ms instead of 1000ms

Note: Upstash REST API doesn't support true pub/sub subscriptions. Keep the polling approach but reduce interval to 500ms. Use `rpush`/`lpop` as a message queue pattern.

## 13. Desktop/Mobile Preview Toggle

- In email detail HTML tab, add toggle: "Desktop (100%)" / "Mobile (375px)"
- Sets iframe width accordingly

## 14. API Keys

- `apiKey` field on `users` table (random 32-byte hex)
- Generate/regenerate in Settings page
- API routes accept `Authorization: Bearer <api-key>` as alternative to Clerk session
- `requireAuth()` checks Clerk session first, falls back to API key
