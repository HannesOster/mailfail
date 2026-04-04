import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";
import { emails } from "./emails";

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailId: uuid("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
});
