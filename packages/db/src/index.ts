import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

export * from "./schema";
export * as userQueries from "./queries/users";
export * as inboxQueries from "./queries/inboxes";
export * as emailQueries from "./queries/emails";
export * as htmlCheckQueries from "./queries/html-checks";
export * as validationQueries from "./queries/validation";
export * as attachmentQueries from "./queries/attachments";

// SQLite dialect (CLI)
export { createSqliteDb, type SqliteDatabase } from "./sqlite";
export * as sqliteSchema from "./schema/sqlite";
export * as sqliteInboxQueries from "./queries/sqlite-inboxes";
export * as sqliteEmailQueries from "./queries/sqlite-emails";
export * as sqliteValidationQueries from "./queries/sqlite-validation";
export * as sqliteAttachmentQueries from "./queries/sqlite-attachments";
