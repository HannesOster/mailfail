import { VALIDATION_CONFIG } from "@mailfail/shared";
import type { SpamScoreResult, CheckEntry } from "@mailfail/shared";

const SPAM_WORDS = [
  "free", "winner", "congratulations", "urgent", "act now",
  "limited time", "click here", "buy now", "order now", "no cost",
  "risk free", "guarantee", "no obligation",
];

export function checkSpam(
  html: string,
  opts: { subject?: string; hasPlainText?: boolean } = {},
): SpamScoreResult {
  const details: CheckEntry[] = [];
  let score = 0;

  const hasUnsubscribe = /unsubscribe/i.test(html);
  if (!hasUnsubscribe) {
    score += 2;
    details.push({ severity: "warning", message: "No unsubscribe link found" });
  }

  const imgCount = (html.match(/<img/gi) || []).length;
  const textContent = html.replace(/<[^>]+>/g, "").trim();
  const textLength = textContent.length;
  const estimatedImageArea = imgCount * 50_000;
  const totalContent = textLength + estimatedImageArea;

  if (totalContent > 0 && estimatedImageArea / totalContent > VALIDATION_CONFIG.spamCheck.imageRatioThreshold) {
    score += 2;
    details.push({
      severity: "warning",
      message: `High image-to-text ratio (${imgCount} images, ${textLength} chars of text)`,
    });
  }

  const lowerHtml = html.toLowerCase();
  const foundWords = SPAM_WORDS.filter((word) => lowerHtml.includes(word));
  if (foundWords.length > 0) {
    score += Math.min(foundWords.length, 3);
    details.push({
      severity: "info",
      message: `Spam trigger words found: ${foundWords.join(", ")}`,
    });
  }

  if (opts.hasPlainText === false) {
    score += 1;
    details.push({
      severity: "warning",
      message: "No plain-text alternative (multipart/alternative recommended)",
    });
  }

  if (opts.subject && opts.subject === opts.subject.toUpperCase() && opts.subject.length > 5) {
    score += 2;
    details.push({ severity: "warning", message: "Subject line is ALL CAPS" });
  }

  return { score: Math.min(score, 10), details };
}
