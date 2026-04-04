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
