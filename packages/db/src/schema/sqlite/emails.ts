import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sqliteInboxes } from "./inboxes";

export const sqliteEmails = sqliteTable("emails", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  inboxId: text("inbox_id")
    .notNull()
    .references(() => sqliteInboxes.id, { onDelete: "cascade" }),
  from: text("from").notNull(),
  to: text("to", { mode: "json" }).notNull().$type<string[]>(),
  cc: text("cc", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  bcc: text("bcc", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  subject: text("subject").notNull().default("(no subject)"),
  htmlBody: text("html_body"),
  textBody: text("text_body"),
  rawSource: text("raw_source").notNull(),
  headers: text("headers", { mode: "json" })
    .notNull()
    .$type<Record<string, string>>(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  receivedAt: text("received_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
