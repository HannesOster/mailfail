import type { ValidationResult } from "@mailfail/shared";
import { checkLinks } from "./link-check";
import { checkImages } from "./image-check";
import { checkSpam } from "./spam-check";
import { checkHtml } from "./html-check";
import { checkCompat } from "./compat-check";
import { checkA11y } from "./a11y-check";
import { calculateScore } from "./score";

export async function runValidation(
  html: string,
  opts: { subject?: string; hasPlainText?: boolean } = {},
): Promise<ValidationResult> {
  const [linkChecks, imageChecks, spamScore, htmlIssues, compatIssues, a11yIssues] =
    await Promise.all([
      checkLinks(html),
      checkImages(html),
      Promise.resolve(checkSpam(html, opts)),
      Promise.resolve(checkHtml(html)),
      Promise.resolve(checkCompat(html)),
      Promise.resolve(checkA11y(html)),
    ]);

  const allChecks = [
    ...linkChecks,
    ...imageChecks,
    ...spamScore.details,
    ...htmlIssues,
    ...compatIssues,
    ...a11yIssues,
  ];

  const overallScore = calculateScore(allChecks);

  return {
    overallScore,
    linkChecks,
    imageChecks,
    spamScore,
    htmlIssues,
    compatIssues,
    a11yIssues,
    checkedAt: new Date().toISOString(),
  };
}
