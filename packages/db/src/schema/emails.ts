import { pgTable, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { inboxes } from "./inboxes";

export const emails = pgTable("emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  inboxId: uuid("inbox_id")
    .notNull()
    .references(() => inboxes.id, { onDelete: "cascade" }),
  from: text("from").notNull(),
  to: jsonb("to").notNull().$type<string[]>(),
  cc: jsonb("cc").notNull().$type<string[]>().default([]),
  bcc: jsonb("bcc").notNull().$type<string[]>().default([]),
  subject: text("subject").notNull().default("(no subject)"),
  htmlBody: text("html_body"),
  textBody: text("text_body"),
  rawSource: text("raw_source").notNull(),
  headers: jsonb("headers").notNull().$type<Record<string, string>>(),
  isRead: boolean("is_read").notNull().default(false),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});
