import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sqliteEmails } from "./emails";
import type {
  LinkCheckEntry,
  ImageCheckEntry,
  SpamScoreResult,
  CheckEntry,
  OverallScore,
} from "@mailfail/shared";

export const sqliteValidationResults = sqliteTable("validation_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  emailId: text("email_id").references(() => sqliteEmails.id, {
    onDelete: "cascade",
  }),
  overallScore: text("overall_score").notNull().$type<OverallScore>(),
  linkChecks: text("link_checks", { mode: "json" })
    .notNull()
    .$type<LinkCheckEntry[]>()
    .$defaultFn(() => []),
  imageChecks: text("image_checks", { mode: "json" })
    .notNull()
    .$type<ImageCheckEntry[]>()
    .$defaultFn(() => []),
  spamScore: text("spam_score", { mode: "json" })
    .notNull()
    .$type<SpamScoreResult>(),
  htmlIssues: text("html_issues", { mode: "json" })
    .notNull()
    .$type<CheckEntry[]>()
    .$defaultFn(() => []),
  compatIssues: text("compat_issues", { mode: "json" })
    .notNull()
    .$type<CheckEntry[]>()
    .$defaultFn(() => []),
  a11yIssues: text("a11y_issues", { mode: "json" })
    .notNull()
    .$type<CheckEntry[]>()
    .$defaultFn(() => []),
  checkedAt: text("checked_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
