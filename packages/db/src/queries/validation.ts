import { eq } from "drizzle-orm";
import type { Database } from "..";
import { validationResults } from "../schema";
import type { ValidationResult } from "@mailfail/shared";

export async function upsertValidationResult(
  db: Database,
  data: {
    emailId?: string;
    htmlCheckId?: string;
  } & ValidationResult,
) {
  const { emailId, htmlCheckId, ...result } = data;

  if (emailId) {
    await db
      .delete(validationResults)
      .where(eq(validationResults.emailId, emailId));
  }
  if (htmlCheckId) {
    await db
      .delete(validationResults)
      .where(eq(validationResults.htmlCheckId, htmlCheckId));
  }

  const [inserted] = await db
    .insert(validationResults)
    .values({
      emailId: emailId ?? null,
      htmlCheckId: htmlCheckId ?? null,
      overallScore: result.overallScore,
      linkChecks: result.linkChecks,
      imageChecks: result.imageChecks,
      spamScore: result.spamScore,
      htmlIssues: result.htmlIssues,
      compatIssues: result.compatIssues,
      a11yIssues: result.a11yIssues,
    })
    .returning();

  return inserted;
}

export async function getValidationForEmail(db: Database, emailId: string) {
  const [result] = await db
    .select()
    .from(validationResults)
    .where(eq(validationResults.emailId, emailId))
    .limit(1);

  return result ?? null;
}

export async function getValidationForHtmlCheck(db: Database, htmlCheckId: string) {
  const [result] = await db
    .select()
    .from(validationResults)
    .where(eq(validationResults.htmlCheckId, htmlCheckId))
    .limit(1);

  return result ?? null;
}
