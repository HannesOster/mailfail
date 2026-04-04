# MailFail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a SaaS email testing tool (Mailtrap alternative) with SMTP catching, live inbox, HTML upload validation, and a 6-check validation pipeline — all at $0/month infrastructure cost.

**Architecture:** pnpm monorepo with Turborepo. Two apps: Next.js 15 web app (Vercel Hobby) and Node.js SMTP server (Oracle Cloud Free). Shared database package (Drizzle + Neon PostgreSQL) and shared types. Redis (Upstash) for Pub/Sub between SMTP and web. SSE for realtime browser updates.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS, Drizzle ORM, PostgreSQL (Neon), Redis (Upstash), Clerk Auth, Vercel Blob, `smtp-server`, `mailparser`, Turborepo, pnpm workspaces.

**Design Workflow:** Stitch designs are created for all screens before any frontend implementation. Components are built as 1:1 pixel-perfect match of the Stitch HTML output.

---

## File Structure

```
mailfail/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx                          # Root layout with ClerkProvider
│   │   │   │   ├── page.tsx                            # Landing page
│   │   │   │   ├── sign-in/[[...sign-in]]/page.tsx     # Clerk sign-in
│   │   │   │   ├── sign-up/[[...sign-up]]/page.tsx     # Clerk sign-up
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── layout.tsx                      # Dashboard shell (sidebar, nav)
│   │   │   │   │   ├── page.tsx                        # Overview: stats, quick actions
│   │   │   │   │   ├── inboxes/
│   │   │   │   │   │   ├── page.tsx                    # Inbox list
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx                # Email list (SSE live)
│   │   │   │   │   │       └── [mailId]/
│   │   │   │   │   │           └── page.tsx            # Email detail (tabs)
│   │   │   │   │   ├── html-check/
│   │   │   │   │   │   ├── page.tsx                    # Upload/paste/URL form
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx                # Check result detail
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx                    # Org settings, members
│   │   │   │   └── api/
│   │   │   │       ├── inboxes/
│   │   │   │       │   ├── route.ts                    # GET (list), POST (create)
│   │   │   │       │   └── [id]/
│   │   │   │       │       ├── route.ts                # DELETE, PATCH
│   │   │   │       │       ├── emails/
│   │   │   │       │       │   ├── route.ts            # GET (list), DELETE (all)
│   │   │   │       │       │   └── [mailId]/
│   │   │   │       │       │       ├── route.ts        # GET, DELETE
│   │   │   │       │       │       └── recheck/
│   │   │   │       │       │           └── route.ts    # POST
│   │   │   │       │       └── stream/
│   │   │   │       │           └── route.ts            # GET (SSE)
│   │   │   │       └── html-checks/
│   │   │   │           ├── route.ts                    # GET, POST
│   │   │   │           └── [id]/
│   │   │   │               ├── route.ts                # GET, DELETE
│   │   │   │               └── recheck/
│   │   │   │                   └── route.ts            # POST
│   │   │   ├── lib/
│   │   │   │   ├── redis.ts                            # Upstash Redis client
│   │   │   │   ├── blob.ts                             # Vercel Blob helpers
│   │   │   │   ├── limits.ts                           # Plan limit checks
│   │   │   │   └── validation/
│   │   │   │       ├── pipeline.ts                     # Orchestrator: runs all 6 checks in parallel
│   │   │   │       ├── link-check.ts                   # Check 1: link validation
│   │   │   │       ├── image-check.ts                  # Check 2: image validation
│   │   │   │       ├── spam-check.ts                   # Check 3: spam score
│   │   │   │       ├── html-check.ts                   # Check 4: HTML validation
│   │   │   │       ├── compat-check.ts                 # Check 5: email client compatibility
│   │   │   │       ├── a11y-check.ts                   # Check 6: accessibility
│   │   │   │       └── score.ts                        # Overall score calculation
│   │   │   └── components/                             # Built 1:1 from Stitch HTML
│   │   │       ├── landing/                            # Landing page components
│   │   │       ├── dashboard/                          # Dashboard shell components
│   │   │       ├── inbox/                              # Inbox list + detail components
│   │   │       ├── email/                              # Email detail + tabs components
│   │   │       ├── validation/                         # Shared validation result components
│   │   │       ├── html-check/                         # HTML check form + result components
│   │   │       └── settings/                           # Settings components
│   │   ├── middleware.ts                               # Clerk auth middleware
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── smtp/
│       ├── src/
│       │   ├── index.ts                                # Entry: starts SMTP server
│       │   ├── server.ts                               # SMTP server setup + auth
│       │   ├── handler.ts                              # onData: parse, store, publish
│       │   └── health.ts                               # Health-check endpoint (HTTP)
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── index.ts                                # Drizzle client export
│   │   │   ├── schema/
│   │   │   │   ├── organizations.ts                    # organizations table
│   │   │   │   ├── inboxes.ts                          # inboxes table
│   │   │   │   ├── emails.ts                           # emails table
│   │   │   │   ├── attachments.ts                      # attachments table
│   │   │   │   ├── validation-results.ts               # validation_results table
│   │   │   │   ├── html-checks.ts                      # html_checks table
│   │   │   │   └── index.ts                            # re-export all schemas
│   │   │   └── queries/
│   │   │       ├── inboxes.ts                          # inbox CRUD + credential generation
│   │   │       ├── emails.ts                           # email CRUD + pagination
│   │   │       ├── html-checks.ts                      # html-check CRUD
│   │   │       ├── validation.ts                       # validation result CRUD
│   │   │       └── organizations.ts                    # org lookup + isOwner check
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/
│       ├── src/
│       │   ├── types.ts                                # Shared TypeScript types
│       │   ├── constants.ts                            # Plan limits, validation thresholds
│       │   └── index.ts                                # Re-export
│       ├── tsconfig.json
│       └── package.json
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
└── .gitignore
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/constants.ts`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "mailfail",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "db:push": "turbo db:push",
    "db:generate": "turbo db:generate"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "pnpm@9.15.4"
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "db:push": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
.next/
dist/
.env
.env.local
.turbo/
*.tsbuildinfo
```

- [ ] **Step 5: Create .env.example**

```bash
# Database (Neon)
DATABASE_URL=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# SMTP
SMTP_PORT=2525
SMTP_HOST=0.0.0.0

# Owner org ID (bypasses all limits)
OWNER_ORG_ID=
```

- [ ] **Step 6: Create packages/shared/package.json**

```json
{
  "name": "@mailfail/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

- [ ] **Step 7: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create packages/shared/src/constants.ts**

```typescript
export const PLAN_LIMITS = {
  free: {
    maxInboxes: 1,
    maxMailsPerMonth: 100,
    maxHtmlChecksPerMonth: 20,
    maxAttachmentSizeBytes: 10 * 1024 * 1024, // 10 MB
    mailRetentionDays: 7,
    maxOrgMembers: 3,
  },
} as const;

export const SMTP_CONFIG = {
  maxMessageSizeBytes: 25 * 1024 * 1024, // 25 MB
  maxRatePerSecond: 10,
  port: 2525,
} as const;

export const VALIDATION_CONFIG = {
  linkCheck: {
    timeoutMs: 10_000,
    maxRedirects: 5,
    slowThresholdMs: 3_000,
  },
  imageCheck: {
    oversizeThresholdBytes: 1 * 1024 * 1024, // 1 MB
  },
  spamCheck: {
    imageRatioThreshold: 0.6, // > 60% images = warning
  },
  htmlFetch: {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    timeoutMs: 30_000,
  },
} as const;

export const SCORE_THRESHOLDS = {
  green: { maxErrors: 0, maxWarnings: 3 },
  yellow: { maxErrors: 2 },
  // anything above yellow is red
} as const;
```

- [ ] **Step 9: Create packages/shared/src/types.ts**

```typescript
export type OverallScore = "green" | "yellow" | "red";
export type Severity = "error" | "warning" | "info";
export type HtmlCheckSource = "upload" | "paste" | "url";

export interface CheckEntry {
  severity: Severity;
  message: string;
  element?: string; // affected HTML element or URL
}

export interface LinkCheckEntry extends CheckEntry {
  originalUrl: string;
  finalUrl: string | null;
  statusCode: number | null;
  redirectChain: string[];
  responseTimeMs: number | null;
}

export interface ImageCheckEntry extends CheckEntry {
  src: string;
  reachable: boolean;
  sizeBytes: number | null;
  hasDimensions: boolean;
}

export interface SpamScoreResult {
  score: number; // 0-10
  details: CheckEntry[];
}

export interface ValidationResult {
  overallScore: OverallScore;
  linkChecks: LinkCheckEntry[];
  imageChecks: ImageCheckEntry[];
  spamScore: SpamScoreResult;
  htmlIssues: CheckEntry[];
  compatIssues: CheckEntry[];
  a11yIssues: CheckEntry[];
  checkedAt: string; // ISO timestamp
}

export interface SseEvent {
  type: "new-email" | "validation-complete";
  emailId: string;
  inboxId: string;
}
```

- [ ] **Step 10: Create packages/shared/src/index.ts**

```typescript
export * from "./types";
export * from "./constants";
```

- [ ] **Step 11: Install dependencies and verify**

Run: `pnpm install`
Expected: Workspace resolves, no errors.

Run: `cd packages/shared && pnpm lint`
Expected: No TypeScript errors.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold monorepo with shared types and constants"
```

---

## Task 2: Database Package (packages/db)

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema/organizations.ts`
- Create: `packages/db/src/schema/inboxes.ts`
- Create: `packages/db/src/schema/emails.ts`
- Create: `packages/db/src/schema/attachments.ts`
- Create: `packages/db/src/schema/validation-results.ts`
- Create: `packages/db/src/schema/html-checks.ts`
- Create: `packages/db/src/schema/index.ts`

- [ ] **Step 1: Create packages/db/package.json**

```json
{
  "name": "@mailfail/db",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "drizzle-orm": "^0.39",
    "@neondatabase/serverless": "^0.10",
    "@mailfail/shared": "workspace:*"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create packages/db/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create packages/db/drizzle.config.ts**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: Create packages/db/src/schema/organizations.ts**

```typescript
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkOrgId: text("clerk_org_id").notNull().unique(),
  name: text("name").notNull(),
  isOwner: boolean("is_owner").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 5: Create packages/db/src/schema/inboxes.ts**

```typescript
import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const inboxes = pgTable("inboxes", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  smtpUser: text("smtp_user").notNull().unique(),
  smtpPass: text("smtp_pass").notNull(),
  monthlyMailCount: integer("monthly_mail_count").notNull().default(0),
  monthlyResetAt: timestamp("monthly_reset_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 6: Create packages/db/src/schema/emails.ts**

```typescript
import { pgTable, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { inboxes } from "./inboxes";

export const emails = pgTable("emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  inboxId: uuid("inbox_id")
    .notNull()
    .references(() => inboxes.id, { onDelete: "cascade" }),
  from: text("from").notNull(),
  to: jsonb("to").notNull().$type<string[]>(),
  cc: jsonb("cc").notNull().$type<string[]>().default([]),
  bcc: jsonb("bcc").notNull().$type<string[]>().default([]),
  subject: text("subject").notNull().default("(no subject)"),
  htmlBody: text("html_body"),
  textBody: text("text_body"),
  rawSource: text("raw_source").notNull(),
  headers: jsonb("headers").notNull().$type<Record<string, string>>(),
  isRead: boolean("is_read").notNull().default(false),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 7: Create packages/db/src/schema/attachments.ts**

```typescript
import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";
import { emails } from "./emails";

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailId: uuid("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
});
```

- [ ] **Step 8: Create packages/db/src/schema/validation-results.ts**

```typescript
import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { emails } from "./emails";
import { htmlChecks } from "./html-checks";
import type {
  LinkCheckEntry,
  ImageCheckEntry,
  SpamScoreResult,
  CheckEntry,
  OverallScore,
} from "@mailfail/shared";

export const validationResults = pgTable("validation_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailId: uuid("email_id").references(() => emails.id, { onDelete: "cascade" }),
  htmlCheckId: uuid("html_check_id").references(() => htmlChecks.id, { onDelete: "cascade" }),
  overallScore: text("overall_score").notNull().$type<OverallScore>(),
  linkChecks: jsonb("link_checks").notNull().$type<LinkCheckEntry[]>().default([]),
  imageChecks: jsonb("image_checks").notNull().$type<ImageCheckEntry[]>().default([]),
  spamScore: jsonb("spam_score").notNull().$type<SpamScoreResult>(),
  htmlIssues: jsonb("html_issues").notNull().$type<CheckEntry[]>().default([]),
  compatIssues: jsonb("compat_issues").notNull().$type<CheckEntry[]>().default([]),
  a11yIssues: jsonb("a11y_issues").notNull().$type<CheckEntry[]>().default([]),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 9: Create packages/db/src/schema/html-checks.ts**

Note: This file must be created BEFORE validation-results.ts due to the foreign key reference. The step order in the plan accounts for this — create html-checks.ts first, then validation-results.ts.

```typescript
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import type { HtmlCheckSource } from "@mailfail/shared";

export const htmlChecks = pgTable("html_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  source: text("source").notNull().$type<HtmlCheckSource>(),
  htmlContent: text("html_content").notNull(),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 10: Create packages/db/src/schema/index.ts**

```typescript
export { organizations } from "./organizations";
export { inboxes } from "./inboxes";
export { emails } from "./emails";
export { attachments } from "./attachments";
export { htmlChecks } from "./html-checks";
export { validationResults } from "./validation-results";
```

- [ ] **Step 11: Create packages/db/src/index.ts**

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

export * from "./schema";
```

- [ ] **Step 12: Install and verify**

Run: `pnpm install`

Run: `cd packages/db && pnpm lint`
Expected: No TypeScript errors.

- [ ] **Step 13: Commit**

```bash
git add packages/db
git commit -m "feat: add database package with drizzle schema"
```

---

## Task 3: Database Query Layer (packages/db/queries)

**Files:**
- Create: `packages/db/src/queries/organizations.ts`
- Create: `packages/db/src/queries/inboxes.ts`
- Create: `packages/db/src/queries/emails.ts`
- Create: `packages/db/src/queries/html-checks.ts`
- Create: `packages/db/src/queries/validation.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Create packages/db/src/queries/organizations.ts**

```typescript
import { eq } from "drizzle-orm";
import type { Database } from "..";
import { organizations } from "../schema";

export async function getOrCreateOrganization(
  db: Database,
  clerkOrgId: string,
  name: string,
) {
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const isOwner = clerkOrgId === process.env.OWNER_ORG_ID;

  const [org] = await db
    .insert(organizations)
    .values({ clerkOrgId, name, isOwner })
    .returning();

  return org;
}

export async function isOwnerOrg(db: Database, clerkOrgId: string): Promise<boolean> {
  const [org] = await db
    .select({ isOwner: organizations.isOwner })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
    .limit(1);

  return org?.isOwner ?? false;
}

export async function getOrganizationByClerkId(db: Database, clerkOrgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
    .limit(1);

  return org ?? null;
}
```

- [ ] **Step 2: Create packages/db/src/queries/inboxes.ts**

```typescript
import { eq, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { Database } from "..";
import { inboxes } from "../schema";

function generateCredentials() {
  return {
    smtpUser: randomBytes(12).toString("hex"),
    smtpPass: randomBytes(24).toString("hex"),
  };
}

function getMonthlyResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export async function createInbox(db: Database, organizationId: string, name: string) {
  const { smtpUser, smtpPass } = generateCredentials();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      organizationId,
      name,
      smtpUser,
      smtpPass,
      monthlyResetAt: getMonthlyResetDate(),
    })
    .returning();

  return inbox;
}

export async function listInboxes(db: Database, organizationId: string) {
  return db
    .select()
    .from(inboxes)
    .where(eq(inboxes.organizationId, organizationId))
    .orderBy(inboxes.createdAt);
}

export async function getInbox(db: Database, id: string, organizationId: string) {
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(and(eq(inboxes.id, id), eq(inboxes.organizationId, organizationId)))
    .limit(1);

  return inbox ?? null;
}

export async function deleteInbox(db: Database, id: string, organizationId: string) {
  return db
    .delete(inboxes)
    .where(and(eq(inboxes.id, id), eq(inboxes.organizationId, organizationId)));
}

export async function renameInbox(
  db: Database,
  id: string,
  organizationId: string,
  name: string,
) {
  const [updated] = await db
    .update(inboxes)
    .set({ name })
    .where(and(eq(inboxes.id, id), eq(inboxes.organizationId, organizationId)))
    .returning();

  return updated ?? null;
}

export async function authenticateSmtp(db: Database, smtpUser: string, smtpPass: string) {
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(and(eq(inboxes.smtpUser, smtpUser), eq(inboxes.smtpPass, smtpPass)))
    .limit(1);

  return inbox ?? null;
}

export async function incrementMailCount(db: Database, inboxId: string) {
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(eq(inboxes.id, inboxId))
    .limit(1);

  if (!inbox) return null;

  // Reset counter if we've passed the reset date
  const now = new Date();
  if (now >= inbox.monthlyResetAt) {
    const [updated] = await db
      .update(inboxes)
      .set({
        monthlyMailCount: 1,
        monthlyResetAt: getMonthlyResetDate(),
      })
      .where(eq(inboxes.id, inboxId))
      .returning();
    return updated;
  }

  const [updated] = await db
    .update(inboxes)
    .set({
      monthlyMailCount: sql`${inboxes.monthlyMailCount} + 1`,
    })
    .where(eq(inboxes.id, inboxId))
    .returning();

  return updated;
}

export async function getInboxCount(db: Database, organizationId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(inboxes)
    .where(eq(inboxes.organizationId, organizationId));

  return Number(result[0].count);
}
```

- [ ] **Step 3: Create packages/db/src/queries/emails.ts**

```typescript
import { eq, and, desc, sql } from "drizzle-orm";
import type { Database } from "..";
import { emails } from "../schema";

export async function insertEmail(
  db: Database,
  data: {
    inboxId: string;
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    htmlBody: string | null;
    textBody: string | null;
    rawSource: string;
    headers: Record<string, string>;
  },
) {
  const [email] = await db.insert(emails).values(data).returning();
  return email;
}

export async function listEmails(
  db: Database,
  inboxId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  const { limit = 50, offset = 0 } = opts;

  return db
    .select()
    .from(emails)
    .where(eq(emails.inboxId, inboxId))
    .orderBy(desc(emails.receivedAt))
    .limit(limit)
    .offset(offset);
}

export async function getEmail(db: Database, id: string, inboxId: string) {
  const [email] = await db
    .select()
    .from(emails)
    .where(and(eq(emails.id, id), eq(emails.inboxId, inboxId)))
    .limit(1);

  return email ?? null;
}

export async function deleteEmail(db: Database, id: string, inboxId: string) {
  return db
    .delete(emails)
    .where(and(eq(emails.id, id), eq(emails.inboxId, inboxId)));
}

export async function deleteAllEmails(db: Database, inboxId: string) {
  return db.delete(emails).where(eq(emails.inboxId, inboxId));
}

export async function markAsRead(db: Database, id: string) {
  return db.update(emails).set({ isRead: true }).where(eq(emails.id, id));
}

export async function getEmailCount(db: Database, inboxId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(eq(emails.inboxId, inboxId));

  return Number(result[0].count);
}
```

- [ ] **Step 4: Create packages/db/src/queries/html-checks.ts**

```typescript
import { eq, and, desc, sql } from "drizzle-orm";
import type { Database } from "..";
import { htmlChecks } from "../schema";
import type { HtmlCheckSource } from "@mailfail/shared";

export async function insertHtmlCheck(
  db: Database,
  data: {
    organizationId: string;
    name: string;
    source: HtmlCheckSource;
    htmlContent: string;
    sourceUrl?: string;
  },
) {
  const [check] = await db.insert(htmlChecks).values(data).returning();
  return check;
}

export async function listHtmlChecks(db: Database, organizationId: string) {
  return db
    .select()
    .from(htmlChecks)
    .where(eq(htmlChecks.organizationId, organizationId))
    .orderBy(desc(htmlChecks.createdAt));
}

export async function getHtmlCheck(db: Database, id: string, organizationId: string) {
  const [check] = await db
    .select()
    .from(htmlChecks)
    .where(and(eq(htmlChecks.id, id), eq(htmlChecks.organizationId, organizationId)))
    .limit(1);

  return check ?? null;
}

export async function deleteHtmlCheck(db: Database, id: string, organizationId: string) {
  return db
    .delete(htmlChecks)
    .where(and(eq(htmlChecks.id, id), eq(htmlChecks.organizationId, organizationId)));
}

export async function getHtmlCheckCount(
  db: Database,
  organizationId: string,
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(htmlChecks)
    .where(eq(htmlChecks.organizationId, organizationId));

  return Number(result[0].count);
}
```

- [ ] **Step 5: Create packages/db/src/queries/validation.ts**

```typescript
import { eq } from "drizzle-orm";
import type { Database } from "..";
import { validationResults } from "../schema";
import type { ValidationResult } from "@mailfail/shared";

export async function upsertValidationResult(
  db: Database,
  data: {
    emailId?: string;
    htmlCheckId?: string;
  } & ValidationResult,
) {
  const { emailId, htmlCheckId, ...result } = data;

  // Delete existing result for this email/htmlCheck
  if (emailId) {
    await db
      .delete(validationResults)
      .where(eq(validationResults.emailId, emailId));
  }
  if (htmlCheckId) {
    await db
      .delete(validationResults)
      .where(eq(validationResults.htmlCheckId, htmlCheckId));
  }

  const [inserted] = await db
    .insert(validationResults)
    .values({
      emailId: emailId ?? null,
      htmlCheckId: htmlCheckId ?? null,
      overallScore: result.overallScore,
      linkChecks: result.linkChecks,
      imageChecks: result.imageChecks,
      spamScore: result.spamScore,
      htmlIssues: result.htmlIssues,
      compatIssues: result.compatIssues,
      a11yIssues: result.a11yIssues,
    })
    .returning();

  return inserted;
}

export async function getValidationForEmail(db: Database, emailId: string) {
  const [result] = await db
    .select()
    .from(validationResults)
    .where(eq(validationResults.emailId, emailId))
    .limit(1);

  return result ?? null;
}

export async function getValidationForHtmlCheck(db: Database, htmlCheckId: string) {
  const [result] = await db
    .select()
    .from(validationResults)
    .where(eq(validationResults.htmlCheckId, htmlCheckId))
    .limit(1);

  return result ?? null;
}
```

- [ ] **Step 6: Update packages/db/src/index.ts to export queries**

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

export * from "./schema";
export * as organizationQueries from "./queries/organizations";
export * as inboxQueries from "./queries/inboxes";
export * as emailQueries from "./queries/emails";
export * as htmlCheckQueries from "./queries/html-checks";
export * as validationQueries from "./queries/validation";
```

- [ ] **Step 7: Verify**

Run: `cd packages/db && pnpm lint`
Expected: No TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add packages/db/src/queries packages/db/src/index.ts
git commit -m "feat: add database query layer for all entities"
```

---

## Task 4: Next.js App Scaffold + Clerk Auth

**Files:**
- Create: `apps/web/` (via create-next-app)
- Create: `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`
- Create: `apps/web/middleware.ts`
- Create: `apps/web/src/lib/db.ts`
- Create: `apps/web/src/lib/redis.ts`
- Create: `apps/web/src/lib/limits.ts`

- [ ] **Step 1: Scaffold Next.js app**

Run from monorepo root:

```bash
cd apps && pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

- [ ] **Step 2: Add workspace dependencies to apps/web/package.json**

Add to `dependencies`:

```json
{
  "@mailfail/db": "workspace:*",
  "@mailfail/shared": "workspace:*",
  "@clerk/nextjs": "^7",
  "@upstash/redis": "^1",
  "@vercel/blob": "^0.27"
}
```

Run: `pnpm install`

- [ ] **Step 3: Create apps/web/src/lib/db.ts**

```typescript
import { createDb } from "@mailfail/db";

export const db = createDb(process.env.DATABASE_URL!);
```

- [ ] **Step 4: Create apps/web/src/lib/redis.ts**

```typescript
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

- [ ] **Step 5: Create apps/web/src/lib/limits.ts**

```typescript
import { PLAN_LIMITS } from "@mailfail/shared";
import { db } from "./db";
import { isOwnerOrg } from "@mailfail/db/src/queries/organizations";
import { getInboxCount } from "@mailfail/db/src/queries/inboxes";

export async function checkInboxLimit(clerkOrgId: string, organizationId: string) {
  if (await isOwnerOrg(db, clerkOrgId)) return { allowed: true } as const;

  const count = await getInboxCount(db, organizationId);
  if (count >= PLAN_LIMITS.free.maxInboxes) {
    return { allowed: false, reason: "Inbox limit reached (1 inbox on Free plan)" } as const;
  }
  return { allowed: true } as const;
}

export async function checkMailLimit(
  clerkOrgId: string,
  monthlyMailCount: number,
) {
  if (await isOwnerOrg(db, clerkOrgId)) return { allowed: true } as const;

  if (monthlyMailCount >= PLAN_LIMITS.free.maxMailsPerMonth) {
    return {
      allowed: false,
      reason: "Monthly email limit reached (100 emails on Free plan)",
    } as const;
  }
  return { allowed: true } as const;
}

export async function checkHtmlCheckLimit(
  clerkOrgId: string,
  currentMonthCount: number,
) {
  if (await isOwnerOrg(db, clerkOrgId)) return { allowed: true } as const;

  if (currentMonthCount >= PLAN_LIMITS.free.maxHtmlChecksPerMonth) {
    return {
      allowed: false,
      reason: "Monthly HTML check limit reached (20 on Free plan)",
    } as const;
  }
  return { allowed: true } as const;
}
```

- [ ] **Step 6: Create apps/web/middleware.ts**

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 7: Update apps/web/src/app/layout.tsx with ClerkProvider**

```tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailFail — Email Testing Made Simple",
  description: "Catch, inspect, and validate test emails. A Mailtrap alternative.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 8: Create sign-in and sign-up pages**

Create `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

Create `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 9: Verify build**

Run: `pnpm build --filter=web`
Expected: Build succeeds (will warn about missing env vars, that's OK).

- [ ] **Step 10: Commit**

```bash
git add apps/web
git commit -m "feat: scaffold next.js app with clerk auth and workspace deps"
```

---

## Task 5: SMTP Server App

**Files:**
- Create: `apps/smtp/package.json`
- Create: `apps/smtp/tsconfig.json`
- Create: `apps/smtp/src/index.ts`
- Create: `apps/smtp/src/server.ts`
- Create: `apps/smtp/src/handler.ts`
- Create: `apps/smtp/src/health.ts`

- [ ] **Step 1: Create apps/smtp/package.json**

```json
{
  "name": "@mailfail/smtp",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@mailfail/db": "workspace:*",
    "@mailfail/shared": "workspace:*",
    "smtp-server": "^3",
    "mailparser": "^3",
    "@upstash/redis": "^1",
    "dotenv": "^16"
  },
  "devDependencies": {
    "@types/smtp-server": "^3",
    "@types/mailparser": "^3",
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create apps/smtp/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create apps/smtp/src/server.ts**

```typescript
import { SMTPServer } from "smtp-server";
import type { Database } from "@mailfail/db";
import { authenticateSmtp } from "@mailfail/db/src/queries/inboxes";
import { SMTP_CONFIG } from "@mailfail/shared";
import { handleMessage } from "./handler";

export function createSmtpServer(db: Database, redisUrl: string, redisToken: string) {
  const server = new SMTPServer({
    authOptional: false,
    size: SMTP_CONFIG.maxMessageSizeBytes,
    disabledCommands: ["STARTTLS"], // Allow plain auth for dev, add TLS later

    async onAuth(auth, session, callback) {
      try {
        const inbox = await authenticateSmtp(db, auth.username, auth.password);
        if (!inbox) {
          return callback(new Error("Invalid credentials"));
        }
        // Attach inbox to session for use in onData
        (session as any).inbox = inbox;
        callback(null, { user: inbox.id });
      } catch (err) {
        callback(new Error("Authentication failed"));
      }
    },

    onData(stream, session, callback) {
      handleMessage(stream, session, db, redisUrl, redisToken)
        .then(() => callback())
        .catch((err) => callback(new Error(err.message)));
    },
  });

  return server;
}
```

- [ ] **Step 4: Create apps/smtp/src/handler.ts**

```typescript
import { simpleParser } from "mailparser";
import type { Readable } from "stream";
import type { SMTPServerSession } from "smtp-server";
import { Redis } from "@upstash/redis";
import type { Database } from "@mailfail/db";
import { insertEmail } from "@mailfail/db/src/queries/emails";
import { incrementMailCount } from "@mailfail/db/src/queries/inboxes";
import { getOrganizationByClerkId } from "@mailfail/db/src/queries/organizations";
import { organizations } from "@mailfail/db";
import { eq } from "drizzle-orm";
import { inboxes } from "@mailfail/db";
import { PLAN_LIMITS } from "@mailfail/shared";
import type { SseEvent } from "@mailfail/shared";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function handleMessage(
  stream: Readable,
  session: SMTPServerSession,
  db: Database,
  redisUrl: string,
  redisToken: string,
) {
  const inbox = (session as any).inbox;
  if (!inbox) throw new Error("No inbox in session");

  // Check monthly limit
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, inbox.organizationId))
    .limit(1);

  if (org && !org.isOwner) {
    if (inbox.monthlyMailCount >= PLAN_LIMITS.free.maxMailsPerMonth) {
      throw new Error("Monthly email limit reached");
    }
  }

  const rawBuffer = await streamToBuffer(stream);
  const rawSource = rawBuffer.toString("utf-8");
  const parsed = await simpleParser(rawBuffer);

  const email = await insertEmail(db, {
    inboxId: inbox.id,
    from: parsed.from?.text ?? "unknown",
    to: parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map((a) => a.text) : [parsed.to.text]) : [],
    cc: parsed.cc ? (Array.isArray(parsed.cc) ? parsed.cc.map((a) => a.text) : [parsed.cc.text]) : [],
    bcc: parsed.bcc ? (Array.isArray(parsed.bcc) ? parsed.bcc.map((a) => a.text) : [parsed.bcc.text]) : [],
    subject: parsed.subject ?? "(no subject)",
    htmlBody: parsed.html || null,
    textBody: parsed.text || null,
    rawSource,
    headers: Object.fromEntries(parsed.headers),
  });

  // TODO: Handle attachments (upload to Vercel Blob) — Task 8

  await incrementMailCount(db, inbox.id);

  // Publish SSE event via Redis
  const redis = new Redis({ url: redisUrl, token: redisToken });
  const event: SseEvent = {
    type: "new-email",
    emailId: email.id,
    inboxId: inbox.id,
  };
  await redis.publish(`inbox:${inbox.id}`, JSON.stringify(event));
}
```

- [ ] **Step 5: Create apps/smtp/src/health.ts**

```typescript
import http from "http";

export function createHealthServer(port: number) {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`Health check server listening on port ${port}`);
  });

  return server;
}
```

- [ ] **Step 6: Create apps/smtp/src/index.ts**

```typescript
import "dotenv/config";
import { createDb } from "@mailfail/db";
import { SMTP_CONFIG } from "@mailfail/shared";
import { createSmtpServer } from "./server";
import { createHealthServer } from "./health";

const db = createDb(process.env.DATABASE_URL!);

const smtpServer = createSmtpServer(
  db,
  process.env.UPSTASH_REDIS_REST_URL!,
  process.env.UPSTASH_REDIS_REST_TOKEN!,
);

const port = Number(process.env.SMTP_PORT) || SMTP_CONFIG.port;

smtpServer.listen(port, "0.0.0.0", () => {
  console.log(`SMTP server listening on port ${port}`);
});

// Health check for Oracle Cloud keep-alive cron
createHealthServer(Number(process.env.HEALTH_PORT) || 3001);

smtpServer.on("error", (err) => {
  console.error("SMTP server error:", err);
});
```

- [ ] **Step 7: Install and verify**

Run: `pnpm install`

Run: `cd apps/smtp && pnpm lint`
Expected: No TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add apps/smtp
git commit -m "feat: add smtp server with auth, mail parsing, and redis pub/sub"
```

---

## Task 6: Validation Pipeline

**Files:**
- Create: `apps/web/src/lib/validation/link-check.ts`
- Create: `apps/web/src/lib/validation/image-check.ts`
- Create: `apps/web/src/lib/validation/spam-check.ts`
- Create: `apps/web/src/lib/validation/html-check.ts`
- Create: `apps/web/src/lib/validation/compat-check.ts`
- Create: `apps/web/src/lib/validation/a11y-check.ts`
- Create: `apps/web/src/lib/validation/score.ts`
- Create: `apps/web/src/lib/validation/pipeline.ts`

- [ ] **Step 1: Create apps/web/src/lib/validation/link-check.ts**

```typescript
import { VALIDATION_CONFIG } from "@mailfail/shared";
import type { LinkCheckEntry } from "@mailfail/shared";

export async function checkLinks(html: string): Promise<LinkCheckEntry[]> {
  const hrefRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  const urls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1];
    if (url.startsWith("http://") || url.startsWith("https://")) {
      urls.add(url);
    }
  }

  const results: LinkCheckEntry[] = [];

  await Promise.all(
    [...urls].map(async (originalUrl) => {
      const start = Date.now();
      const redirectChain: string[] = [];
      let currentUrl = originalUrl;
      let statusCode: number | null = null;
      let finalUrl: string | null = null;

      try {
        for (let i = 0; i < VALIDATION_CONFIG.linkCheck.maxRedirects; i++) {
          const response = await fetch(currentUrl, {
            method: "HEAD",
            redirect: "manual",
            signal: AbortSignal.timeout(VALIDATION_CONFIG.linkCheck.timeoutMs),
          });

          statusCode = response.status;

          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) break;
            redirectChain.push(currentUrl);
            currentUrl = new URL(location, currentUrl).toString();
          } else {
            break;
          }
        }

        finalUrl = currentUrl;
        const responseTimeMs = Date.now() - start;

        let severity: LinkCheckEntry["severity"] = "info";
        let message = `OK (${statusCode})`;

        if (statusCode && statusCode >= 400) {
          severity = "error";
          message = `HTTP ${statusCode}`;
        } else if (
          redirectChain.length > 0 &&
          new URL(finalUrl).hostname !== new URL(originalUrl).hostname
        ) {
          severity = "warning";
          message = `Redirects to different domain: ${new URL(finalUrl).hostname}`;
        } else if (responseTimeMs > VALIDATION_CONFIG.linkCheck.slowThresholdMs) {
          severity = "info";
          message = `Slow response (${responseTimeMs}ms)`;
        }

        results.push({
          severity,
          message,
          element: `<a href="${originalUrl}">`,
          originalUrl,
          finalUrl,
          statusCode,
          redirectChain,
          responseTimeMs,
        });
      } catch (err) {
        results.push({
          severity: "error",
          message: `Failed to reach: ${(err as Error).message}`,
          element: `<a href="${originalUrl}">`,
          originalUrl,
          finalUrl: null,
          statusCode: null,
          redirectChain,
          responseTimeMs: null,
        });
      }
    }),
  );

  return results;
}
```

- [ ] **Step 2: Create apps/web/src/lib/validation/image-check.ts**

```typescript
import { VALIDATION_CONFIG } from "@mailfail/shared";
import type { ImageCheckEntry } from "@mailfail/shared";

export async function checkImages(html: string): Promise<ImageCheckEntry[]> {
  const imgRegex = /<img[^>]*>/gi;
  const srcRegex = /src=["']([^"']+)["']/i;
  const widthRegex = /width=/i;
  const heightRegex = /height=/i;

  const results: ImageCheckEntry[] = [];
  let match: RegExpExecArray | null;

  const images: { src: string; tag: string; hasDimensions: boolean }[] = [];

  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0];
    const srcMatch = srcRegex.exec(tag);
    if (!srcMatch) continue;
    const src = srcMatch[1];
    if (!src.startsWith("http://") && !src.startsWith("https://")) continue;

    images.push({
      src,
      tag,
      hasDimensions: widthRegex.test(tag) && heightRegex.test(tag),
    });
  }

  await Promise.all(
    images.map(async ({ src, tag, hasDimensions }) => {
      try {
        const response = await fetch(src, {
          method: "HEAD",
          signal: AbortSignal.timeout(VALIDATION_CONFIG.linkCheck.timeoutMs),
        });

        const contentLength = response.headers.get("content-length");
        const sizeBytes = contentLength ? parseInt(contentLength, 10) : null;

        const entry: ImageCheckEntry = {
          severity: "info",
          message: "OK",
          element: tag,
          src,
          reachable: response.ok,
          sizeBytes,
          hasDimensions,
        };

        if (!response.ok) {
          entry.severity = "error";
          entry.message = `Unreachable (HTTP ${response.status})`;
        } else if (sizeBytes && sizeBytes > VALIDATION_CONFIG.imageCheck.oversizeThresholdBytes) {
          entry.severity = "warning";
          entry.message = `Oversized image (${(sizeBytes / 1024 / 1024).toFixed(1)} MB)`;
        } else if (!hasDimensions) {
          entry.severity = "info";
          entry.message = "Missing width/height attributes";
        }

        results.push(entry);
      } catch {
        results.push({
          severity: "error",
          message: "Failed to reach image",
          element: tag,
          src,
          reachable: false,
          sizeBytes: null,
          hasDimensions,
        });
      }
    }),
  );

  return results;
}
```

- [ ] **Step 3: Create apps/web/src/lib/validation/spam-check.ts**

```typescript
import { VALIDATION_CONFIG } from "@mailfail/shared";
import type { SpamScoreResult, CheckEntry } from "@mailfail/shared";

const SPAM_WORDS = [
  "free", "winner", "congratulations", "urgent", "act now",
  "limited time", "click here", "buy now", "order now", "no cost",
  "risk free", "guarantee", "no obligation",
];

export function checkSpam(
  html: string,
  opts: { subject?: string; hasPlainText?: boolean } = {},
): SpamScoreResult {
  const details: CheckEntry[] = [];
  let score = 0;

  // Check for unsubscribe link
  const hasUnsubscribe = /unsubscribe/i.test(html);
  if (!hasUnsubscribe) {
    score += 2;
    details.push({
      severity: "warning",
      message: "No unsubscribe link found",
    });
  }

  // Image-to-text ratio
  const imgCount = (html.match(/<img/gi) || []).length;
  const textContent = html.replace(/<[^>]+>/g, "").trim();
  const textLength = textContent.length;
  const estimatedImageArea = imgCount * 50_000; // rough estimate
  const totalContent = textLength + estimatedImageArea;

  if (totalContent > 0 && estimatedImageArea / totalContent > VALIDATION_CONFIG.spamCheck.imageRatioThreshold) {
    score += 2;
    details.push({
      severity: "warning",
      message: `High image-to-text ratio (${imgCount} images, ${textLength} chars of text)`,
    });
  }

  // Spam words
  const lowerHtml = html.toLowerCase();
  const foundWords = SPAM_WORDS.filter((word) => lowerHtml.includes(word));
  if (foundWords.length > 0) {
    score += Math.min(foundWords.length, 3);
    details.push({
      severity: "info",
      message: `Spam trigger words found: ${foundWords.join(", ")}`,
    });
  }

  // Missing plain text
  if (opts.hasPlainText === false) {
    score += 1;
    details.push({
      severity: "warning",
      message: "No plain-text alternative (multipart/alternative recommended)",
    });
  }

  // ALL CAPS subject
  if (opts.subject && opts.subject === opts.subject.toUpperCase() && opts.subject.length > 5) {
    score += 2;
    details.push({
      severity: "warning",
      message: "Subject line is ALL CAPS",
    });
  }

  return { score: Math.min(score, 10), details };
}
```

- [ ] **Step 4: Create apps/web/src/lib/validation/html-check.ts**

```typescript
import type { CheckEntry } from "@mailfail/shared";

const DEPRECATED_ELEMENTS = [
  "center", "font", "marquee", "blink", "big", "strike", "tt",
];

export function checkHtml(html: string): CheckEntry[] {
  const issues: CheckEntry[] = [];

  // Check for unclosed tags (simple heuristic)
  const openTags: string[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;
  const selfClosing = new Set([
    "img", "br", "hr", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr",
  ]);

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    if (selfClosing.has(tagName) || fullTag.endsWith("/>")) continue;

    if (fullTag.startsWith("</")) {
      const lastOpen = openTags[openTags.length - 1];
      if (lastOpen === tagName) {
        openTags.pop();
      } else if (openTags.includes(tagName)) {
        // Mismatched nesting
        issues.push({
          severity: "error",
          message: `Mismatched closing tag: </${tagName}> (expected </${lastOpen}>)`,
          element: fullTag,
        });
      }
    } else {
      openTags.push(tagName);
    }
  }

  for (const unclosed of openTags) {
    issues.push({
      severity: "error",
      message: `Unclosed tag: <${unclosed}>`,
      element: `<${unclosed}>`,
    });
  }

  // Missing alt attributes
  const imgWithoutAlt = /<img(?![^>]*alt=)[^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgWithoutAlt.exec(html)) !== null) {
    issues.push({
      severity: "warning",
      message: "Image missing alt attribute",
      element: imgMatch[0].substring(0, 80),
    });
  }

  // Deprecated elements
  for (const elem of DEPRECATED_ELEMENTS) {
    const regex = new RegExp(`<${elem}[\\s>]`, "gi");
    if (regex.test(html)) {
      issues.push({
        severity: "info",
        message: `Deprecated element: <${elem}>`,
        element: `<${elem}>`,
      });
    }
  }

  return issues;
}
```

- [ ] **Step 5: Create apps/web/src/lib/validation/compat-check.ts**

```typescript
import type { CheckEntry } from "@mailfail/shared";

interface CssRule {
  property: string;
  clients: string[];
  severity: CheckEntry["severity"];
}

// Based on caniemail.com data — most impactful incompatibilities
const UNSUPPORTED_CSS: CssRule[] = [
  { property: "display:\\s*flex", clients: ["Outlook"], severity: "warning" },
  { property: "display:\\s*grid", clients: ["Outlook"], severity: "warning" },
  { property: "max-width", clients: ["Outlook (Windows)"], severity: "info" },
  { property: "background-image", clients: ["Outlook (Windows)"], severity: "warning" },
  { property: "border-radius", clients: ["Outlook (Windows)"], severity: "info" },
  { property: "position:\\s*(absolute|fixed)", clients: ["Gmail", "Outlook"], severity: "warning" },
  { property: "box-shadow", clients: ["Outlook (Windows)"], severity: "info" },
  { property: "gap", clients: ["Outlook"], severity: "warning" },
];

const STRUCTURE_ISSUES: { pattern: RegExp; message: string; clients: string[]; severity: CheckEntry["severity"] }[] = [
  {
    pattern: /<style[^>]*>[\s\S]*?<\/style>/gi,
    message: "<style> block in HTML — may be stripped by Gmail (webmail)",
    clients: ["Gmail (webmail)"],
    severity: "info",
  },
  {
    pattern: /@media/gi,
    message: "Media queries — not supported in many email clients",
    clients: ["Gmail", "Outlook (Windows)", "Yahoo"],
    severity: "info",
  },
  {
    pattern: /@font-face/gi,
    message: "Custom fonts (@font-face) — limited email client support",
    clients: ["Gmail", "Outlook", "Yahoo"],
    severity: "warning",
  },
];

export function checkCompat(html: string): CheckEntry[] {
  const issues: CheckEntry[] = [];

  // Check CSS properties in inline styles and style blocks
  for (const rule of UNSUPPORTED_CSS) {
    const regex = new RegExp(rule.property, "gi");
    if (regex.test(html)) {
      issues.push({
        severity: rule.severity,
        message: `"${rule.property.replace(/\\s\*/, " ")}" not supported in: ${rule.clients.join(", ")}`,
        element: rule.property,
      });
    }
  }

  // Check structural issues
  for (const issue of STRUCTURE_ISSUES) {
    if (issue.pattern.test(html)) {
      issues.push({
        severity: issue.severity,
        message: `${issue.message} (${issue.clients.join(", ")})`,
      });
    }
  }

  return issues;
}
```

- [ ] **Step 6: Create apps/web/src/lib/validation/a11y-check.ts**

```typescript
import type { CheckEntry } from "@mailfail/shared";

const VAGUE_LINK_TEXTS = [
  "click here", "here", "read more", "more", "learn more", "link", "this",
];

export function checkA11y(html: string): CheckEntry[] {
  const issues: CheckEntry[] = [];

  // Check for empty or meaningless alt text
  const altRegex = /alt=["']([^"']*)["']/gi;
  let altMatch: RegExpExecArray | null;
  while ((altMatch = altRegex.exec(html)) !== null) {
    const altText = altMatch[1].trim();
    if (altText && /^(image|img|photo|picture|banner|icon)\.(png|jpg|jpeg|gif|svg|webp)$/i.test(altText)) {
      issues.push({
        severity: "warning",
        message: `Meaningless alt text: "${altText}" — describe the image content instead`,
        element: altMatch[0],
      });
    }
  }

  // Check for vague link texts
  const linkRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const linkText = linkMatch[1].replace(/<[^>]+>/g, "").trim().toLowerCase();
    if (VAGUE_LINK_TEXTS.includes(linkText)) {
      issues.push({
        severity: "info",
        message: `Vague link text: "${linkText}" — use descriptive text instead`,
        element: linkMatch[0].substring(0, 80),
      });
    }
  }

  // Check heading structure
  const headings: { level: number; text: string }[] = [];
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(headingMatch[1], 10),
      text: headingMatch[2].replace(/<[^>]+>/g, "").trim(),
    });
  }

  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) {
      issues.push({
        severity: "warning",
        message: `Heading level skipped: h${headings[i - 1].level} → h${headings[i].level}`,
        element: `<h${headings[i].level}>${headings[i].text}</h${headings[i].level}>`,
      });
    }
  }

  // Check for low contrast (simple heuristic: white text on light bg or black text on dark bg)
  const colorRegex = /color:\s*#([0-9a-fA-F]{3,6})/gi;
  let colorMatch: RegExpExecArray | null;
  while ((colorMatch = colorRegex.exec(html)) !== null) {
    const hex = colorMatch[1];
    const fullHex = hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Flag very light or very dark colors that might have contrast issues
    if (luminance > 0.95 || luminance < 0.05) {
      issues.push({
        severity: "info",
        message: `Potential contrast issue: color #${fullHex} (${luminance > 0.5 ? "very light" : "very dark"})`,
        element: colorMatch[0],
      });
    }
  }

  return issues;
}
```

- [ ] **Step 7: Create apps/web/src/lib/validation/score.ts**

```typescript
import { SCORE_THRESHOLDS } from "@mailfail/shared";
import type { OverallScore, CheckEntry } from "@mailfail/shared";

export function calculateScore(allChecks: CheckEntry[]): OverallScore {
  const errors = allChecks.filter((c) => c.severity === "error").length;
  const warnings = allChecks.filter((c) => c.severity === "warning").length;

  if (errors === 0 && warnings <= SCORE_THRESHOLDS.green.maxWarnings) {
    return "green";
  }

  if (errors <= SCORE_THRESHOLDS.yellow.maxErrors) {
    return "yellow";
  }

  return "red";
}
```

- [ ] **Step 8: Create apps/web/src/lib/validation/pipeline.ts**

```typescript
import type { ValidationResult } from "@mailfail/shared";
import { checkLinks } from "./link-check";
import { checkImages } from "./image-check";
import { checkSpam } from "./spam-check";
import { checkHtml } from "./html-check";
import { checkCompat } from "./compat-check";
import { checkA11y } from "./a11y-check";
import { calculateScore } from "./score";

export async function runValidation(
  html: string,
  opts: { subject?: string; hasPlainText?: boolean } = {},
): Promise<ValidationResult> {
  const [linkChecks, imageChecks, spamScore, htmlIssues, compatIssues, a11yIssues] =
    await Promise.all([
      checkLinks(html),
      checkImages(html),
      Promise.resolve(checkSpam(html, opts)),
      Promise.resolve(checkHtml(html)),
      Promise.resolve(checkCompat(html)),
      Promise.resolve(checkA11y(html)),
    ]);

  const allChecks = [
    ...linkChecks,
    ...imageChecks,
    ...spamScore.details,
    ...htmlIssues,
    ...compatIssues,
    ...a11yIssues,
  ];

  const overallScore = calculateScore(allChecks);

  return {
    overallScore,
    linkChecks,
    imageChecks,
    spamScore,
    htmlIssues,
    compatIssues,
    a11yIssues,
    checkedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 9: Verify**

Run: `cd apps/web && pnpm lint`
Expected: No TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/lib/validation
git commit -m "feat: add 6-check validation pipeline (links, images, spam, html, compat, a11y)"
```

---

## Task 7: API Routes

**Files:**
- Create: `apps/web/src/app/api/inboxes/route.ts`
- Create: `apps/web/src/app/api/inboxes/[id]/route.ts`
- Create: `apps/web/src/app/api/inboxes/[id]/emails/route.ts`
- Create: `apps/web/src/app/api/inboxes/[id]/emails/[mailId]/route.ts`
- Create: `apps/web/src/app/api/inboxes/[id]/emails/[mailId]/recheck/route.ts`
- Create: `apps/web/src/app/api/inboxes/[id]/stream/route.ts`
- Create: `apps/web/src/app/api/html-checks/route.ts`
- Create: `apps/web/src/app/api/html-checks/[id]/route.ts`
- Create: `apps/web/src/app/api/html-checks/[id]/recheck/route.ts`
- Create: `apps/web/src/lib/auth.ts`

- [ ] **Step 1: Create apps/web/src/lib/auth.ts**

Helper to get current org from Clerk:

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { getOrCreateOrganization } from "@mailfail/db/src/queries/organizations";

export async function requireOrg() {
  const { userId, orgId, orgSlug } = await auth();

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (!orgId) {
    throw new Response("No organization selected", { status: 403 });
  }

  const org = await getOrCreateOrganization(db, orgId, orgSlug ?? "default");

  return { userId, orgId, org };
}
```

- [ ] **Step 2: Create apps/web/src/app/api/inboxes/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { listInboxes, createInbox } from "@mailfail/db/src/queries/inboxes";
import { checkInboxLimit } from "@/lib/limits";

export async function GET() {
  const { org } = await requireOrg();
  const inboxes = await listInboxes(db, org.id);
  return NextResponse.json(inboxes);
}

export async function POST(request: Request) {
  const { org, orgId } = await requireOrg();

  const limit = await checkInboxLimit(orgId, org.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const inbox = await createInbox(db, org.id, name);
  return NextResponse.json(inbox, { status: 201 });
}
```

- [ ] **Step 3: Create apps/web/src/app/api/inboxes/[id]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getInbox, deleteInbox, renameInbox } from "@mailfail/db/src/queries/inboxes";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  await deleteInbox(db, id, org.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;
  const { name } = await request.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await renameInbox(db, id, org.id, name);
  if (!updated) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
```

- [ ] **Step 4: Create apps/web/src/app/api/inboxes/[id]/emails/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { listEmails, deleteAllEmails } from "@mailfail/db/src/queries/emails";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const emails = await listEmails(db, id, { limit, offset });
  return NextResponse.json(emails);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  await deleteAllEmails(db, id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Create apps/web/src/app/api/inboxes/[id]/emails/[mailId]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { getEmail, deleteEmail, markAsRead } from "@mailfail/db/src/queries/emails";
import { getValidationForEmail } from "@mailfail/db/src/queries/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; mailId: string }> },
) {
  const { org } = await requireOrg();
  const { id, mailId } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const email = await getEmail(db, mailId, id);
  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  await markAsRead(db, mailId);

  const validation = await getValidationForEmail(db, mailId);

  return NextResponse.json({ ...email, validation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mailId: string }> },
) {
  const { org } = await requireOrg();
  const { id, mailId } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  await deleteEmail(db, mailId, id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Create apps/web/src/app/api/inboxes/[id]/emails/[mailId]/recheck/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { getEmail } from "@mailfail/db/src/queries/emails";
import { upsertValidationResult } from "@mailfail/db/src/queries/validation";
import { runValidation } from "@/lib/validation/pipeline";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; mailId: string }> },
) {
  const { org } = await requireOrg();
  const { id, mailId } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const email = await getEmail(db, mailId, id);
  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const html = email.htmlBody ?? email.textBody ?? "";
  const result = await runValidation(html, {
    subject: email.subject,
    hasPlainText: !!email.textBody,
  });

  const saved = await upsertValidationResult(db, {
    emailId: mailId,
    ...result,
  });

  return NextResponse.json(saved);
}
```

- [ ] **Step 7: Create apps/web/src/app/api/inboxes/[id]/stream/route.ts**

```typescript
import { redis } from "@/lib/redis";
import { requireOrg } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return new Response("Inbox not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const channelName = `inbox:${id}`;

      // Poll Redis for messages (Upstash doesn't support persistent subscribe,
      // so we use a polling pattern with a Redis list as alternative)
      // For SSE, we'll use a simple polling approach with Upstash
      const interval = setInterval(async () => {
        try {
          const message = await redis.lpop<string>(channelName);
          if (message) {
            controller.enqueue(
              encoder.encode(`data: ${typeof message === "string" ? message : JSON.stringify(message)}\n\n`),
            );
          }
        } catch {
          // Connection lost, close stream
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      // Send keepalive every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
          clearInterval(interval);
        }
      }, 30_000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 8: Create apps/web/src/app/api/html-checks/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { insertHtmlCheck, listHtmlChecks, getHtmlCheckCount } from "@mailfail/db/src/queries/html-checks";
import { upsertValidationResult } from "@mailfail/db/src/queries/validation";
import { checkHtmlCheckLimit } from "@/lib/limits";
import { runValidation } from "@/lib/validation/pipeline";
import { VALIDATION_CONFIG } from "@mailfail/shared";
import type { HtmlCheckSource } from "@mailfail/shared";

export async function GET() {
  const { org } = await requireOrg();
  const checks = await listHtmlChecks(db, org.id);
  return NextResponse.json(checks);
}

export async function POST(request: Request) {
  const { org, orgId } = await requireOrg();

  const count = await getHtmlCheckCount(db, org.id);
  const limit = await checkHtmlCheckLimit(orgId, count);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  const body = await request.json();
  const { name, source, htmlContent, sourceUrl } = body as {
    name: string;
    source: HtmlCheckSource;
    htmlContent?: string;
    sourceUrl?: string;
  };

  if (!name || !source) {
    return NextResponse.json({ error: "name and source are required" }, { status: 400 });
  }

  let html = htmlContent ?? "";

  // Fetch URL if source is "url"
  if (source === "url" && sourceUrl) {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(VALIDATION_CONFIG.htmlFetch.timeoutMs),
    });
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > VALIDATION_CONFIG.htmlFetch.maxSizeBytes) {
      return NextResponse.json({ error: "HTML too large (max 5 MB)" }, { status: 400 });
    }
    html = await response.text();
  }

  if (!html) {
    return NextResponse.json({ error: "No HTML content provided" }, { status: 400 });
  }

  const check = await insertHtmlCheck(db, {
    organizationId: org.id,
    name,
    source,
    htmlContent: html,
    sourceUrl,
  });

  // Run validation immediately
  const result = await runValidation(html);
  await upsertValidationResult(db, { htmlCheckId: check.id, ...result });

  return NextResponse.json(check, { status: 201 });
}
```

- [ ] **Step 9: Create apps/web/src/app/api/html-checks/[id]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getHtmlCheck, deleteHtmlCheck } from "@mailfail/db/src/queries/html-checks";
import { getValidationForHtmlCheck } from "@mailfail/db/src/queries/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const check = await getHtmlCheck(db, id, org.id);
  if (!check) {
    return NextResponse.json({ error: "HTML check not found" }, { status: 404 });
  }

  const validation = await getValidationForHtmlCheck(db, id);

  return NextResponse.json({ ...check, validation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  await deleteHtmlCheck(db, id, org.id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 10: Create apps/web/src/app/api/html-checks/[id]/recheck/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getHtmlCheck } from "@mailfail/db/src/queries/html-checks";
import { upsertValidationResult } from "@mailfail/db/src/queries/validation";
import { runValidation } from "@/lib/validation/pipeline";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const check = await getHtmlCheck(db, id, org.id);
  if (!check) {
    return NextResponse.json({ error: "HTML check not found" }, { status: 404 });
  }

  const result = await runValidation(check.htmlContent);
  const saved = await upsertValidationResult(db, { htmlCheckId: id, ...result });

  return NextResponse.json(saved);
}
```

- [ ] **Step 11: Verify**

Run: `cd apps/web && pnpm lint`
Expected: No TypeScript errors.

- [ ] **Step 12: Commit**

```bash
git add apps/web/src/app/api apps/web/src/lib/auth.ts
git commit -m "feat: add all api routes (inboxes, emails, html-checks, sse stream)"
```

---

## Task 8: Stitch Designs

**Prerequisite:** All backend tasks (1-7) must be complete before this task.

This task creates Stitch designs for all screens. The engineer must use the `figma:figma-generate-design` or Stitch MCP tools to create designs.

**Screens to design:**

- [ ] **Step 1: Create design system in Stitch**

Establish a design system with:
- Colors: primary, secondary, success (green), warning (yellow), danger (red), neutral grays
- Typography: headings, body, code/mono
- Components: buttons, inputs, cards, badges, tables, tabs

Use: `mcp__stitch__create_design_system`

- [ ] **Step 2: Design Landing Page**

Use: `mcp__stitch__generate_screen_from_text`

Prompt: Marketing landing page for MailFail — email testing tool. Hero section with tagline, feature grid (SMTP catching, HTML validation, link checking, real-time inbox), pricing section (Free vs Pro), CTA buttons.

- [ ] **Step 3: Design Dashboard Overview**

Sidebar navigation with: Dashboard, Inboxes, HTML Check, Settings. Main content: stats cards (total inboxes, emails this month, HTML checks), recent activity list.

- [ ] **Step 4: Design Inbox List**

Table/card view of inboxes showing: name, SMTP credentials (user/pass with copy buttons), email count, created date. "New Inbox" button. Each row clickable.

- [ ] **Step 5: Design Inbox Detail (Email List)**

Email list showing: from, subject, received time, read/unread status, validation score badge (green/yellow/red dot). Live update indicator. "Delete All" button.

- [ ] **Step 6: Design Email Detail**

Tab layout with: HTML preview (iframe), Text, Raw Source, Attachments, Validation. The Validation tab shows traffic light score at top, expandable category sections.

- [ ] **Step 7: Design HTML Check Page**

Three-way input: file upload dropzone, textarea for paste, URL input field. Name field. Submit button. Below: list of previous checks with score badges.

- [ ] **Step 8: Design HTML Check Detail**

Same validation view as email detail validation tab: traffic light, expandable categories, re-check button.

- [ ] **Step 9: Design Settings Page**

Org name, member list (with invite), plan info (Free/Pro/Owner badge). Usage stats.

- [ ] **Step 10: Commit design references**

```bash
git add -A
git commit -m "feat: add stitch design references for all screens"
```

---

## Task 9: Frontend Implementation (from Stitch HTML)

**Prerequisite:** Task 8 (Stitch designs) must be complete.

This task implements all frontend pages by reading the Stitch HTML output and creating 1:1 matching React components. Each step references reading the Stitch HTML first.

- [ ] **Step 1: Read Stitch HTML for dashboard layout and create shell**

Read the Stitch HTML for the dashboard layout (sidebar + main content area). Create:

`apps/web/src/app/dashboard/layout.tsx`:

```tsx
// Implementation matches Stitch HTML exactly
// Sidebar with nav links: Dashboard, Inboxes, HTML Check, Settings
// Main content area with header (org name, user menu)
// Clerk UserButton in header
```

This step requires the actual Stitch HTML output to implement. The engineer must:
1. Get the Stitch screen HTML for the dashboard layout
2. Convert the HTML structure to React/Tailwind components
3. Match padding, spacing, colors, fonts exactly

- [ ] **Step 2: Implement Landing Page from Stitch HTML**

Read Stitch HTML for landing page. Create `apps/web/src/app/page.tsx` with hero, features, pricing sections matching Stitch output exactly.

- [ ] **Step 3: Implement Dashboard Overview from Stitch HTML**

Create `apps/web/src/app/dashboard/page.tsx` — stats cards, recent activity. Fetch data from `/api/inboxes`.

- [ ] **Step 4: Implement Inbox List from Stitch HTML**

Create `apps/web/src/app/dashboard/inboxes/page.tsx` — inbox cards/table, SMTP credential display with copy buttons, create inbox dialog.

- [ ] **Step 5: Implement Inbox Detail (Email List) from Stitch HTML**

Create `apps/web/src/app/dashboard/inboxes/[id]/page.tsx` — email list with SSE live updates, validation score badges, delete actions.

SSE hook:

```typescript
function useInboxStream(inboxId: string) {
  const [emails, setEmails] = useState<Email[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/inboxes/${inboxId}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new-email") {
        // Refetch email list
        fetchEmails();
      }
    };

    return () => eventSource.close();
  }, [inboxId]);

  return emails;
}
```

- [ ] **Step 6: Implement Email Detail from Stitch HTML**

Create `apps/web/src/app/dashboard/inboxes/[id]/[mailId]/page.tsx` — tabbed view (HTML preview in sandboxed iframe, text, raw, attachments, validation). Re-check button.

- [ ] **Step 7: Implement HTML Check Page from Stitch HTML**

Create `apps/web/src/app/dashboard/html-check/page.tsx` — file upload dropzone, paste textarea, URL input, name field, submit. Previous checks list below.

- [ ] **Step 8: Implement HTML Check Detail from Stitch HTML**

Create `apps/web/src/app/dashboard/html-check/[id]/page.tsx` — validation result view with traffic light, expandable categories, re-check button.

- [ ] **Step 9: Implement Settings Page from Stitch HTML**

Create `apps/web/src/app/dashboard/settings/page.tsx` — org info, member management (Clerk `<OrganizationProfile />`), plan badge, usage stats.

- [ ] **Step 10: Implement shared Validation Result component**

Create `apps/web/src/components/validation/validation-result.tsx` — shared between email detail and HTML check detail. Traffic light, expandable categories with severity icons, entry list.

- [ ] **Step 11: Verify full build**

Run: `pnpm build`
Expected: All packages and apps build successfully.

- [ ] **Step 12: Commit**

```bash
git add apps/web/src
git commit -m "feat: implement all frontend pages from stitch designs"
```

---

## Task 10: Integration & End-to-End Testing

- [ ] **Step 1: Start local dev environment**

```bash
# Terminal 1: Start web app
cd apps/web && pnpm dev

# Terminal 2: Start SMTP server
cd apps/smtp && pnpm dev
```

- [ ] **Step 2: Push database schema**

```bash
cd packages/db && pnpm db:push
```

Expected: All tables created in Neon.

- [ ] **Step 3: Test SMTP flow end-to-end**

Send a test email via CLI:

```bash
# Using swaks (install via brew install swaks)
swaks \
  --to test@example.com \
  --from sender@example.com \
  --server localhost:2525 \
  --auth \
  --auth-user <smtp_user_from_inbox> \
  --auth-password <smtp_pass_from_inbox> \
  --header "Subject: Test Email" \
  --body "Hello from MailFail testing"
```

Expected: Email appears in inbox via SSE, validation runs automatically.

- [ ] **Step 4: Test HTML check flow**

1. Open `/dashboard/html-check`
2. Paste a sample newsletter HTML
3. Submit
4. Verify validation results appear with correct severity ratings

- [ ] **Step 5: Test limits**

1. Create a free account (non-owner org)
2. Try creating a second inbox → should be rejected
3. Verify monthly counter increments and rejects at 100

- [ ] **Step 6: Fix any issues found during testing**

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: integration testing and fixes"
```

---

## Task 11: Oracle Cloud Deployment Setup

- [ ] **Step 1: Document Oracle Cloud VM setup**

Create `docs/deployment/oracle-cloud-setup.md`:

```markdown
# Oracle Cloud SMTP Server Setup

## 1. Create Always Free ARM VM
- Shape: VM.Standard.A1.Flex (1 OCPU, 6 GB RAM)
- OS: Ubuntu 24.04
- Open port 2525 in security list

## 2. Install Node.js
ssh into VM:
sudo apt update && sudo apt install -y nodejs npm
npm install -g pm2

## 3. Clone and build
git clone <repo>
cd mailfail
npm install -g pnpm
pnpm install
cd apps/smtp && pnpm build

## 4. Environment variables
Create /home/ubuntu/mailfail/apps/smtp/.env with:
DATABASE_URL=<neon_url>
UPSTASH_REDIS_REST_URL=<upstash_url>
UPSTASH_REDIS_REST_TOKEN=<upstash_token>
SMTP_PORT=2525
HEALTH_PORT=3001

## 5. Start with PM2
pm2 start dist/index.js --name mailfail-smtp
pm2 save
pm2 startup

## 6. Health check cron (prevents Oracle idle reclamation)
crontab -e
*/5 * * * * curl -s http://localhost:3001/health > /dev/null
```

- [ ] **Step 2: Set up DNS**

Add A record: `smtp.mailfail.dev` → Oracle VM public IP

- [ ] **Step 3: Deploy web app to Vercel**

```bash
vercel link
vercel env add DATABASE_URL
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add BLOB_READ_WRITE_TOKEN
vercel env add OWNER_ORG_ID
vercel deploy
```

- [ ] **Step 4: Commit deployment docs**

```bash
git add docs/deployment
git commit -m "docs: add oracle cloud and vercel deployment guide"
```
