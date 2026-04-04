import type { CheckEntry } from "@mailfail/shared";

const VAGUE_LINK_TEXTS = [
  "click here", "here", "read more", "more", "learn more", "link", "this",
];

export function checkA11y(html: string): CheckEntry[] {
  const issues: CheckEntry[] = [];

  const altRegex = /alt=["']([^"']*)["']/gi;
  let altMatch: RegExpExecArray | null;
  while ((altMatch = altRegex.exec(html)) !== null) {
    const altText = altMatch[1].trim();
    if (altText && /^(image|img|photo|picture|banner|icon)\.(png|jpg|jpeg|gif|svg|webp)$/i.test(altText)) {
      issues.push({
        severity: "warning",
        message: `Meaningless alt text: "${altText}" — describe the image content instead`,
        element: altMatch[0],
      });
    }
  }

  const linkRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const linkText = linkMatch[1].replace(/<[^>]+>/g, "").trim().toLowerCase();
    if (VAGUE_LINK_TEXTS.includes(linkText)) {
      issues.push({
        severity: "info",
        message: `Vague link text: "${linkText}" — use descriptive text instead`,
        element: linkMatch[0].substring(0, 80),
      });
    }
  }

  const headings: { level: number; text: string }[] = [];
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(headingMatch[1], 10),
      text: headingMatch[2].replace(/<[^>]+>/g, "").trim(),
    });
  }

  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) {
      issues.push({
        severity: "warning",
        message: `Heading level skipped: h${headings[i - 1].level} → h${headings[i].level}`,
        element: `<h${headings[i].level}>${headings[i].text}</h${headings[i].level}>`,
      });
    }
  }

  const colorRegex = /color:\s*#([0-9a-fA-F]{3,6})/gi;
  let colorMatch: RegExpExecArray | null;
  while ((colorMatch = colorRegex.exec(html)) !== null) {
    const hex = colorMatch[1];
    const fullHex = hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    if (luminance > 0.95 || luminance < 0.05) {
      issues.push({
        severity: "info",
        message: `Potential contrast issue: color #${fullHex} (${luminance > 0.5 ? "very light" : "very dark"})`,
        element: colorMatch[0],
      });
    }
  }

  return issues;
}
