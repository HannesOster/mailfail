import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sqliteInboxes = sqliteTable("inboxes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  routeKey: text("route_key").notNull().unique(),
  webhookUrl: text("webhook_url"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
