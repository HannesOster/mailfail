import { eq, inArray } from "drizzle-orm";
import type { SqliteDatabase } from "../sqlite";
import { sqliteValidationResults } from "../schema/sqlite";
import type { ValidationResult } from "@mailfail/shared";

export function upsertValidationResult(
  db: SqliteDatabase,
  data: { emailId: string } & ValidationResult,
) {
  const { emailId, ...result } = data;

  db.delete(sqliteValidationResults)
    .where(eq(sqliteValidationResults.emailId, emailId))
    .run();

  return db
    .insert(sqliteValidationResults)
    .values({
      emailId,
      overallScore: result.overallScore,
      linkChecks: result.linkChecks,
      imageChecks: result.imageChecks,
      spamScore: result.spamScore,
      htmlIssues: result.htmlIssues,
      compatIssues: result.compatIssues,
      a11yIssues: result.a11yIssues,
    })
    .returning()
    .get();
}

export function getValidationForEmail(db: SqliteDatabase, emailId: string) {
  return (
    db
      .select()
      .from(sqliteValidationResults)
      .where(eq(sqliteValidationResults.emailId, emailId))
      .limit(1)
      .get() ?? null
  );
}

export function getValidationsForEmails(db: SqliteDatabase, emailIds: string[]) {
  if (emailIds.length === 0) return [];

  return db
    .select()
    .from(sqliteValidationResults)
    .where(inArray(sqliteValidationResults.emailId, emailIds))
    .all();
}
