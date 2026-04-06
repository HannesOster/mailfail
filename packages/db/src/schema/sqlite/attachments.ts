import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sqliteEmails } from "./emails";

export const sqliteAttachments = sqliteTable("attachments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  emailId: text("email_id")
    .notNull()
    .references(() => sqliteEmails.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
});
