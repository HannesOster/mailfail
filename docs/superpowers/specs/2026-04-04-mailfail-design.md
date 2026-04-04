# MailFail — Design Specification

**Date:** 2026-04-04
**Status:** Draft
**Author:** Johannes Osterkamp + Claude

---

## 1. Overview

MailFail is a SaaS email testing tool (Mailtrap alternative). Developers configure SMTP credentials in their applications to catch and inspect test emails. Additionally, users can upload/paste/fetch HTML (e.g. newsletters) for standalone validation. All emails and HTML uploads run through a comprehensive validation pipeline.

### Goals

- Catch emails via SMTP and display them in a live inbox
- Validate email content: links, images, spam score, HTML, email client compatibility, accessibility
- Standalone HTML validation (upload, paste, URL fetch) for newsletters
- Zero-cost infrastructure for MVP

### Non-Goals (MVP)

- Billing / Stripe integration (added later)
- Email forwarding to real addresses
- Template testing / visual diff
- Team plans with role-based pricing

---

## 2. Architecture

### Monorepo Structure

```
mailfail/
├── apps/
│   ├── web/              # Next.js 15 (App Router) — Vercel Hobby
│   └── smtp/             # Node.js SMTP server — Oracle Cloud Free
├── packages/
│   ├── db/               # Drizzle ORM schema, migrations, queries
│   └── shared/           # Types, validation constants, utilities
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Infrastructure

```
┌─────────────────────────────┐     ┌──────────────────────────┐
│  Vercel (Hobby)             │     │  Oracle Cloud Free       │
│                             │     │                          │
│  Next.js App                │     │  ARM VM (1 CPU, 6GB)     │
│  API Routes                 │◀───▶│  Node.js SMTP Server     │
│  SSE Endpoint               │     │  Port 2525               │
│                             │     │  Cron Health-Check       │
└──────────┬──────────────────┘     └──────────┬───────────────┘
           │                                    │
     ┌─────▼──────┐  ┌──────────┐              │
     │ Neon Free  │  │ Upstash  │◀─────────────┘
     │ PostgreSQL │  │ Redis    │
     └────────────┘  └──────────┘
```

### Tech Stack

| Area | Technology |
|---|---|
| Monorepo | pnpm Workspaces + Turborepo |
| Frontend | Next.js 15 (App Router), React, Tailwind CSS |
| SMTP Server | `smtp-server` (Nodemailer author), `mailparser` |
| Database | PostgreSQL (Neon via Vercel Marketplace) |
| ORM | Drizzle ORM |
| Cache / Pub-Sub | Redis (Upstash via Vercel Marketplace) |
| Auth | Clerk (Vercel Marketplace) |
| Realtime | Server-Sent Events (SSE) |
| File Storage | Vercel Blob (attachments) |
| Email Parsing | `mailparser` |
| Design | Stitch designs, 1:1 implementation from HTML output |
| Deployment | Web: Vercel, SMTP: Oracle Cloud Free (ARM VM) |

### Costs: $0/month

| Service | Tier | Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Neon PostgreSQL | Free (0.5 GB) | $0 |
| Upstash Redis | Free (10k commands/day) | $0 |
| Clerk | Free (10k MAU) | $0 |
| Vercel Blob | Free (1 GB) | $0 |
| Oracle Cloud | Always Free (ARM 1 CPU, 6GB) | $0 |

---

## 3. Data Model

```
User (via Clerk)
 └─ Organization (Clerk Org)
     ├─ isOwner: boolean              # Owner org = unlimited, bypasses all limits
     │
     ├─ Inbox[]
     │   ├─ id: uuid
     │   ├─ name: string              # e.g. "Wannwetsch Staging"
     │   ├─ smtpUser: string          # auto-generated
     │   ├─ smtpPass: string          # auto-generated
     │   ├─ monthlyMailCount: number   # resets monthly
     │   ├─ monthlyResetAt: timestamp
     │   ├─ createdAt: timestamp
     │   │
     │   └─ Email[]
     │       ├─ id: uuid
     │       ├─ from: string
     │       ├─ to: string[]
     │       ├─ cc: string[]
     │       ├─ bcc: string[]
     │       ├─ subject: string
     │       ├─ htmlBody: text
     │       ├─ textBody: text
     │       ├─ rawSource: text
     │       ├─ headers: jsonb
     │       ├─ isRead: boolean
     │       ├─ receivedAt: timestamp
     │       │
     │       ├─ Attachment[]
     │       │   ├─ id: uuid
     │       │   ├─ filename: string
     │       │   ├─ mimeType: string
     │       │   ├─ size: number
     │       │   └─ storagePath: string    # Vercel Blob URL
     │       │
     │       └─ ValidationResult
     │           ├─ id: uuid
     │           ├─ overallScore: enum (green, yellow, red)
     │           ├─ linkChecks: jsonb[]
     │           ├─ imageChecks: jsonb[]
     │           ├─ spamScore: jsonb
     │           ├─ htmlIssues: jsonb[]
     │           ├─ compatIssues: jsonb[]
     │           ├─ a11yIssues: jsonb[]
     │           ├─ checkedAt: timestamp
     │           └─ emailId: uuid | null
     │
     └─ HtmlCheck[]
         ├─ id: uuid
         ├─ name: string               # e.g. "March Newsletter"
         ├─ source: enum (upload, paste, url)
         ├─ htmlContent: text
         ├─ sourceUrl: string | null
         ├─ createdAt: timestamp
         └─ ValidationResult (same structure as above)
```

### Limits

| | Free | Pro (later) | Owner |
|---|---|---|---|
| Inboxes | 1 | Unlimited | Unlimited |
| Mails/month | 100 (rolling, delete does not restore) | Unlimited | Unlimited |
| HTML Checks/month | 20 | Unlimited | Unlimited |
| Max attachment size | 10 MB | 25 MB | Unlimited |
| Mail retention | 7 days auto-delete | 30 days (configurable) | No auto-delete |
| Members (Clerk Org) | 3 | Unlimited | Unlimited |

---

## 4. Flows

### Incoming Email Flow

1. Application sends email to `smtp.mailfail.dev:2525` with inbox SMTP credentials
2. SMTP server authenticates against inbox credentials in PostgreSQL
3. SMTP server parses email (headers, body, attachments) via `mailparser`
4. Stores email in PostgreSQL, uploads attachments to Vercel Blob
5. Increments `monthlyMailCount` on inbox (rejects if limit reached for non-owner orgs)
6. Publishes event via Redis Pub/Sub (`inbox:{id}:new-email`)
7. Next.js SSE endpoint receives Redis event, pushes to connected browser clients
8. Validation pipeline runs asynchronously on the email
9. Validation result stored, SSE update pushed to client

### HTML Upload Flow

1. User uploads HTML file / pastes HTML / provides URL
2. Next.js API route receives HTML (fetches URL if needed)
3. Stores HtmlCheck record in PostgreSQL
4. Validation pipeline runs
5. Result stored and displayed

### Validation Pipeline

All 6 checks run in parallel on the HTML content:

**1. Link Check**
- Extract all `<a href="">` elements
- HEAD request per link (timeout 10s)
- Follow redirect chains (max 5 hops)
- Show final URL vs. original URL
- Severity: 404/500 = error, cross-domain redirect = warning, slow (> 3s) = info

**2. Image Check**
- Extract all `<img src="">` elements
- HEAD request for reachability
- Check file size (> 1MB = warning)
- Check for missing width/height attributes
- Severity: unreachable = error, oversized = warning, missing dimensions = info

**3. Spam Score**
- Unsubscribe link present?
- Image-to-text ratio (> 60% images = warning)
- Suspicious words/phrases
- Missing plain-text part (emails only)
- ALL CAPS in subject
- Severity: aggregated into score 0-10

**4. HTML Validation**
- Unclosed / broken tags
- Missing alt attributes
- Deprecated HTML elements
- Invalid inline styles
- Severity: broken tags = error, missing alt = warning, deprecated = info

**5. Email Client Compatibility**
- Check CSS properties against caniemail.com data
- Outlook issues: flexbox, background-image, max-width, etc.
- Gmail issues: media queries, `<style>` in `<head>`, custom fonts
- Apple Mail / Yahoo specific issues
- Severity: unsupported in major client = warning, unsupported in Outlook = info

**6. Accessibility**
- Color contrast (WCAG AA minimum)
- Alt texts present and meaningful (not "image.png")
- Semantic heading structure
- Link texts (flag "click here", "read more" without context)
- Severity: contrast fail = error, missing alt = warning, vague links = info

**Overall Score:**
- Green: 0 errors, max 3 warnings
- Yellow: 0 errors + > 3 warnings, OR 1-2 errors
- Red: 3+ errors

**Re-Check:** Same pipeline, overwrites previous result, stores new timestamp.

---

## 5. Pages & UI Structure

```
/                                     → Landing page (marketing)
/sign-in                              → Clerk Sign-In
/sign-up                              → Clerk Sign-Up

/dashboard                            → Overview: inboxes, usage stats, quick actions
/dashboard/inboxes                    → Inbox list with SMTP credentials
/dashboard/inboxes/[id]               → Inbox detail: email list (live via SSE)
/dashboard/inboxes/[id]/[mailId]      → Email detail: preview, raw, headers, validation
/dashboard/html-check                 → HTML upload/paste/URL → validation result
/dashboard/html-check/[id]            → Detail view of an HTML check
/dashboard/settings                   → Org settings, members
```

### Email Detail View (Tabs)

- **HTML** — Rendered preview (sandboxed iframe)
- **Text** — Plain-text version
- **Raw** — Original source with headers
- **Attachments** — List with download links
- **Validation** — Traffic light overview + expandable detail per category

### Validation View (shared between emails and HTML checks)

- Traffic light indicator at top (green/yellow/red)
- Expandable categories: Links, Images, Spam, HTML, Compatibility, Accessibility
- Each entry: severity (error/warning/info), description, affected element
- "Re-Check" button for manual re-validation

---

## 6. API Design

### Inboxes

| Method | Route | Description |
|---|---|---|
| GET | `/api/inboxes` | List all inboxes for the org |
| POST | `/api/inboxes` | Create inbox (generates SMTP credentials) |
| DELETE | `/api/inboxes/[id]` | Delete inbox + all emails |
| PATCH | `/api/inboxes/[id]` | Rename inbox |

### Emails

| Method | Route | Description |
|---|---|---|
| GET | `/api/inboxes/[id]/emails` | List emails (paginated) |
| GET | `/api/inboxes/[id]/emails/[mailId]` | Single email with validation |
| DELETE | `/api/inboxes/[id]/emails/[mailId]` | Delete single email |
| DELETE | `/api/inboxes/[id]/emails` | Delete all emails in inbox |
| POST | `/api/inboxes/[id]/emails/[mailId]/recheck` | Re-run validation |

### HTML Checks

| Method | Route | Description |
|---|---|---|
| GET | `/api/html-checks` | List all HTML checks for the org |
| POST | `/api/html-checks` | New check (upload/paste/URL) |
| GET | `/api/html-checks/[id]` | Check result |
| DELETE | `/api/html-checks/[id]` | Delete check |
| POST | `/api/html-checks/[id]/recheck` | Re-run validation |

### Realtime

| Method | Route | Description |
|---|---|---|
| GET | `/api/inboxes/[id]/stream` | SSE stream for new emails + validation updates |

### SMTP Server Communication

The SMTP server writes directly to PostgreSQL (shared `packages/db`) and publishes to Redis. No internal HTTP API needed.

---

## 7. Security

### SMTP

- Authentication required (inbox smtpUser/smtpPass)
- Max email size: 25 MB (including attachments)
- Rate limiting: 10 emails/second per inbox
- STARTTLS support (optional)
- Reject emails when monthly limit reached (non-owner orgs)

### API

- All routes behind Clerk auth middleware
- Org-scoped: users only see their organization's data
- Stripe webhook signature verification (when billing is added)

### Validation Pipeline

- Link/image checks: follow redirects but cap at 5 hops, 10s timeout per request
- HTML fetched from URL: max 5 MB, timeout 30s
- Sandboxed HTML preview via iframe with sandbox attribute

---

## 8. User Model (MVP)

### Owner Organization

- Flagged as `isOwner: true` in database
- All limits bypassed
- No billing
- Full access to all features

### Free Users

- 1 inbox
- 100 emails/month (counter resets on 1st of month, deleting does not restore quota)
- 20 HTML checks/month
- Max 10 MB attachment size
- 7-day auto-delete of emails
- Up to 3 org members

---

## 9. Deployment

### Web App (Next.js)

- Deployed on Vercel (Hobby tier)
- Automatic deployments from main branch
- Environment variables via Vercel dashboard

### SMTP Server

- Deployed on Oracle Cloud Always Free (ARM VM, 1 CPU, 6 GB RAM)
- Node.js process managed via systemd or PM2
- Health-check cron job to prevent Oracle idle reclamation
- DNS: `smtp.mailfail.dev` pointing to Oracle VM public IP

### Database & Services

- PostgreSQL: Neon (provisioned via Vercel Marketplace)
- Redis: Upstash (provisioned via Vercel Marketplace)
- Blob storage: Vercel Blob
- Auth: Clerk (provisioned via Vercel Marketplace)

---

## 10. Design Workflow

1. Create Stitch designs for all screens before implementation
2. Export HTML from Stitch
3. Implement components as 1:1 pixel-perfect match of Stitch HTML output

### Screens to Design

- Landing page
- Sign-in / Sign-up
- Dashboard overview
- Inbox list
- Inbox detail (email list with live updates)
- Email detail (tabs: HTML, Text, Raw, Attachments, Validation)
- HTML check (upload/paste/URL form)
- HTML check detail (validation results)
- Settings (org, members)
