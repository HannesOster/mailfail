import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { emails } from "./emails";
import { htmlChecks } from "./html-checks";
import type {
  LinkCheckEntry,
  ImageCheckEntry,
  SpamScoreResult,
  CheckEntry,
  OverallScore,
} from "@mailfail/shared";

export const validationResults = pgTable("validation_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailId: uuid("email_id").references(() => emails.id, { onDelete: "cascade" }),
  htmlCheckId: uuid("html_check_id").references(() => htmlChecks.id, { onDelete: "cascade" }),
  overallScore: text("overall_score").notNull().$type<OverallScore>(),
  linkChecks: jsonb("link_checks").notNull().$type<LinkCheckEntry[]>().default([]),
  imageChecks: jsonb("image_checks").notNull().$type<ImageCheckEntry[]>().default([]),
  spamScore: jsonb("spam_score").notNull().$type<SpamScoreResult>(),
  htmlIssues: jsonb("html_issues").notNull().$type<CheckEntry[]>().default([]),
  compatIssues: jsonb("compat_issues").notNull().$type<CheckEntry[]>().default([]),
  a11yIssues: jsonb("a11y_issues").notNull().$type<CheckEntry[]>().default([]),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});
