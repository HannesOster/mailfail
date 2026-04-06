import { eq, sql } from "drizzle-orm";
import type { SqliteDatabase } from "../sqlite";
import { sqliteInboxes } from "../schema/sqlite";

export function listInboxes(db: SqliteDatabase) {
  return db.select().from(sqliteInboxes).orderBy(sqliteInboxes.createdAt).all();
}

export function getInbox(db: SqliteDatabase, id: string) {
  return (
    db
      .select()
      .from(sqliteInboxes)
      .where(eq(sqliteInboxes.id, id))
      .limit(1)
      .get() ?? null
  );
}

export function createInbox(db: SqliteDatabase, name: string, routeKey: string) {
  return db.insert(sqliteInboxes).values({ name, routeKey }).returning().get();
}

export function deleteInbox(db: SqliteDatabase, id: string) {
  return db.delete(sqliteInboxes).where(eq(sqliteInboxes.id, id)).run();
}

export function getInboxByRouteKey(db: SqliteDatabase, routeKey: string) {
  return (
    db
      .select()
      .from(sqliteInboxes)
      .where(eq(sqliteInboxes.routeKey, routeKey))
      .limit(1)
      .get() ?? null
  );
}

export function getOrCreateInboxByRouteKey(db: SqliteDatabase, routeKey: string) {
  const existing = getInboxByRouteKey(db, routeKey);
  if (existing) return existing;

  const name = routeKey.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return createInbox(db, name, routeKey);
}

export function getInboxCount(db: SqliteDatabase): number {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(sqliteInboxes)
    .get();

  return Number(result!.count);
}
