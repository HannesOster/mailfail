export type OverallScore = "green" | "yellow" | "red";
export type Severity = "error" | "warning" | "info";
export type HtmlCheckSource = "upload" | "paste" | "url";

export interface CheckEntry {
  severity: Severity;
  message: string;
  element?: string; // affected HTML element or URL
}

export interface LinkCheckEntry extends CheckEntry {
  originalUrl: string;
  finalUrl: string | null;
  statusCode: number | null;
  redirectChain: string[];
  responseTimeMs: number | null;
}

export interface ImageCheckEntry extends CheckEntry {
  src: string;
  reachable: boolean;
  sizeBytes: number | null;
  hasDimensions: boolean;
}

export interface SpamScoreResult {
  score: number; // 0-10
  details: CheckEntry[];
}

export interface ValidationResult {
  overallScore: OverallScore;
  linkChecks: LinkCheckEntry[];
  imageChecks: ImageCheckEntry[];
  spamScore: SpamScoreResult;
  htmlIssues: CheckEntry[];
  compatIssues: CheckEntry[];
  a11yIssues: CheckEntry[];
  checkedAt: string; // ISO timestamp
}

export interface SseEvent {
  type: "new-email" | "validation-complete";
  emailId: string;
  inboxId: string;
}
