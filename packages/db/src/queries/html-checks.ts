import { eq, and, desc, sql } from "drizzle-orm";
import type { Database } from "..";
import { htmlChecks } from "../schema";
import type { HtmlCheckSource } from "@mailfail/shared";

export async function insertHtmlCheck(
  db: Database,
  data: {
    userId: string;
    name: string;
    source: HtmlCheckSource;
    htmlContent: string;
    sourceUrl?: string;
  },
) {
  const [check] = await db.insert(htmlChecks).values(data).returning();
  return check;
}

export async function listHtmlChecks(db: Database, userId: string) {
  return db
    .select()
    .from(htmlChecks)
    .where(eq(htmlChecks.userId, userId))
    .orderBy(desc(htmlChecks.createdAt));
}

export async function getHtmlCheck(db: Database, id: string, userId: string) {
  const [check] = await db
    .select()
    .from(htmlChecks)
    .where(and(eq(htmlChecks.id, id), eq(htmlChecks.userId, userId)))
    .limit(1);

  return check ?? null;
}

export async function deleteHtmlCheck(db: Database, id: string, userId: string) {
  return db
    .delete(htmlChecks)
    .where(and(eq(htmlChecks.id, id), eq(htmlChecks.userId, userId)));
}

export async function getHtmlCheckCount(
  db: Database,
  userId: string,
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(htmlChecks)
    .where(eq(htmlChecks.userId, userId));

  return Number(result[0].count);
}
