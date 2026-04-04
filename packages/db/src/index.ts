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
