import { SCORE_THRESHOLDS } from "@mailfail/shared";
import type { OverallScore, CheckEntry } from "@mailfail/shared";

export function calculateScore(allChecks: CheckEntry[]): OverallScore {
  const errors = allChecks.filter((c) => c.severity === "error").length;
  const warnings = allChecks.filter((c) => c.severity === "warning").length;

  if (errors === 0 && warnings <= SCORE_THRESHOLDS.green.maxWarnings) {
    return "green";
  }

  if (errors <= SCORE_THRESHOLDS.yellow.maxErrors) {
    return "yellow";
  }

  return "red";
}
