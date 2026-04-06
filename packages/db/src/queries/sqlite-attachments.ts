import { eq } from "drizzle-orm";
import type { SqliteDatabase } from "../sqlite";
import { sqliteAttachments } from "../schema/sqlite";

export function insertAttachment(
  db: SqliteDatabase,
  data: {
    emailId: string;
    filename: string;
    mimeType: string;
    size: number;
    storagePath: string;
  },
) {
  return db.insert(sqliteAttachments).values(data).returning().get();
}

export function getAttachmentsByEmailId(db: SqliteDatabase, emailId: string) {
  return db
    .select()
    .from(sqliteAttachments)
    .where(eq(sqliteAttachments.emailId, emailId))
    .all();
}
