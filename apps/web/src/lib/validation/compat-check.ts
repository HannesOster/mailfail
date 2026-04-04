import type { CheckEntry } from "@mailfail/shared";

interface CssRule {
  property: string;
  clients: string[];
  severity: CheckEntry["severity"];
}

const UNSUPPORTED_CSS: CssRule[] = [
  { property: "display:\\s*flex", clients: ["Outlook"], severity: "warning" },
  { property: "display:\\s*grid", clients: ["Outlook"], severity: "warning" },
  { property: "max-width", clients: ["Outlook (Windows)"], severity: "info" },
  { property: "background-image", clients: ["Outlook (Windows)"], severity: "warning" },
  { property: "border-radius", clients: ["Outlook (Windows)"], severity: "info" },
  { property: "position:\\s*(absolute|fixed)", clients: ["Gmail", "Outlook"], severity: "warning" },
  { property: "box-shadow", clients: ["Outlook (Windows)"], severity: "info" },
  { property: "gap", clients: ["Outlook"], severity: "warning" },
];

const STRUCTURE_ISSUES: { pattern: RegExp; message: string; clients: string[]; severity: CheckEntry["severity"] }[] = [
  {
    pattern: /<style[^>]*>[\s\S]*?<\/style>/gi,
    message: "<style> block in HTML — may be stripped by Gmail (webmail)",
    clients: ["Gmail (webmail)"],
    severity: "info",
  },
  {
    pattern: /@media/gi,
    message: "Media queries — not supported in many email clients",
    clients: ["Gmail", "Outlook (Windows)", "Yahoo"],
    severity: "info",
  },
  {
    pattern: /@font-face/gi,
    message: "Custom fonts (@font-face) — limited email client support",
    clients: ["Gmail", "Outlook", "Yahoo"],
    severity: "warning",
  },
];

export function checkCompat(html: string): CheckEntry[] {
  const issues: CheckEntry[] = [];

  for (const rule of UNSUPPORTED_CSS) {
    const regex = new RegExp(rule.property, "gi");
    if (regex.test(html)) {
      issues.push({
        severity: rule.severity,
        message: `"${rule.property.replace(/\\s\*/, " ")}" not supported in: ${rule.clients.join(", ")}`,
        element: rule.property,
      });
    }
  }

  for (const issue of STRUCTURE_ISSUES) {
    if (issue.pattern.test(html)) {
      issues.push({
        severity: issue.severity,
        message: `${issue.message} (${issue.clients.join(", ")})`,
      });
    }
  }

  return issues;
}
