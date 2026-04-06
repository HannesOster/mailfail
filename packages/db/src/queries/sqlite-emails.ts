import { eq, and, desc, sql } from "drizzle-orm";
import type { SqliteDatabase } from "../sqlite";
import { sqliteEmails } from "../schema/sqlite";

export function insertEmail(
  db: SqliteDatabase,
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
  return db.insert(sqliteEmails).values(data).returning().get();
}

export function listEmails(
  db: SqliteDatabase,
  inboxId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  const { limit = 50, offset = 0 } = opts;

  return db
    .select()
    .from(sqliteEmails)
    .where(eq(sqliteEmails.inboxId, inboxId))
    .orderBy(desc(sqliteEmails.receivedAt))
    .limit(limit)
    .offset(offset)
    .all();
}

export function getEmail(db: SqliteDatabase, id: string, inboxId: string) {
  return (
    db
      .select()
      .from(sqliteEmails)
      .where(and(eq(sqliteEmails.id, id), eq(sqliteEmails.inboxId, inboxId)))
      .limit(1)
      .get() ?? null
  );
}

export function deleteEmail(db: SqliteDatabase, id: string, inboxId: string) {
  return db
    .delete(sqliteEmails)
    .where(and(eq(sqliteEmails.id, id), eq(sqliteEmails.inboxId, inboxId)))
    .run();
}

export function deleteAllEmails(db: SqliteDatabase, inboxId: string) {
  return db.delete(sqliteEmails).where(eq(sqliteEmails.inboxId, inboxId)).run();
}

export function markAsRead(db: SqliteDatabase, id: string) {
  return db
    .update(sqliteEmails)
    .set({ isRead: true })
    .where(eq(sqliteEmails.id, id))
    .run();
}

export function setReadStatus(
  db: SqliteDatabase,
  id: string,
  inboxId: string,
  isRead: boolean,
) {
  return db
    .update(sqliteEmails)
    .set({ isRead })
    .where(and(eq(sqliteEmails.id, id), eq(sqliteEmails.inboxId, inboxId)))
    .run();
}

export function getEmailCount(db: SqliteDatabase, inboxId: string): number {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(sqliteEmails)
    .where(eq(sqliteEmails.inboxId, inboxId))
    .get();

  return Number(result!.count);
}
