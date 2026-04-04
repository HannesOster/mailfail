import type { CheckEntry } from "@mailfail/shared";

const DEPRECATED_ELEMENTS = [
  "center", "font", "marquee", "blink", "big", "strike", "tt",
];

export function checkHtml(html: string): CheckEntry[] {
  const issues: CheckEntry[] = [];

  const openTags: string[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;
  const selfClosing = new Set([
    "img", "br", "hr", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr",
  ]);

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    if (selfClosing.has(tagName) || fullTag.endsWith("/>")) continue;

    if (fullTag.startsWith("</")) {
      const lastOpen = openTags[openTags.length - 1];
      if (lastOpen === tagName) {
        openTags.pop();
      } else if (openTags.includes(tagName)) {
        issues.push({
          severity: "error",
          message: `Mismatched closing tag: </${tagName}> (expected </${lastOpen}>)`,
          element: fullTag,
        });
      }
    } else {
      openTags.push(tagName);
    }
  }

  for (const unclosed of openTags) {
    issues.push({
      severity: "error",
      message: `Unclosed tag: <${unclosed}>`,
      element: `<${unclosed}>`,
    });
  }

  const imgWithoutAlt = /<img(?![^>]*alt=)[^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgWithoutAlt.exec(html)) !== null) {
    issues.push({
      severity: "warning",
      message: "Image missing alt attribute",
      element: imgMatch[0].substring(0, 80),
    });
  }

  for (const elem of DEPRECATED_ELEMENTS) {
    const regex = new RegExp(`<${elem}[\\s>]`, "gi");
    if (regex.test(html)) {
      issues.push({
        severity: "info",
        message: `Deprecated element: <${elem}>`,
        element: `<${elem}>`,
      });
    }
  }

  return issues;
}
