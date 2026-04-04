import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./organizations";

export const inboxes = pgTable("inboxes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  smtpUser: text("smtp_user").notNull().unique(),
  smtpPass: text("smtp_pass").notNull(),
  webhookUrl: text("webhook_url"),
  monthlyMailCount: integer("monthly_mail_count").notNull().default(0),
  monthlyResetAt: timestamp("monthly_reset_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
