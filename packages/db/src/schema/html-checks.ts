import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./organizations";
import type { HtmlCheckSource } from "@mailfail/shared";

export const htmlChecks = pgTable("html_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  source: text("source").notNull().$type<HtmlCheckSource>(),
  htmlContent: text("html_content").notNull(),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
