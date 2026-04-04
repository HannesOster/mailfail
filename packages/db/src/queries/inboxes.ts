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

export async function createInbox(db: Database, userId: string, name: string) {
  const { smtpUser, smtpPass } = generateCredentials();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      userId,
      name,
      smtpUser,
      smtpPass,
      monthlyResetAt: getMonthlyResetDate(),
    })
    .returning();

  return inbox;
}

export async function listInboxes(db: Database, userId: string) {
  return db
    .select()
    .from(inboxes)
    .where(eq(inboxes.userId, userId))
    .orderBy(inboxes.createdAt);
}

export async function getInbox(db: Database, id: string, userId: string) {
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(and(eq(inboxes.id, id), eq(inboxes.userId, userId)))
    .limit(1);

  return inbox ?? null;
}

export async function deleteInbox(db: Database, id: string, userId: string) {
  return db
    .delete(inboxes)
    .where(and(eq(inboxes.id, id), eq(inboxes.userId, userId)));
}

export async function renameInbox(
  db: Database,
  id: string,
  userId: string,
  name: string,
) {
  const [updated] = await db
    .update(inboxes)
    .set({ name })
    .where(and(eq(inboxes.id, id), eq(inboxes.userId, userId)))
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

export async function getInboxCount(db: Database, userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(inboxes)
    .where(eq(inboxes.userId, userId));

  return Number(result[0].count);
}
