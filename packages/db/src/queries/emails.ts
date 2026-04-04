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
