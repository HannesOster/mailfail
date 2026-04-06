import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

// Inlined types from @mailfail/shared
type OverallScore = "green" | "yellow" | "red";
type Severity = "error" | "warning" | "info";

interface CheckEntry {
  severity: Severity;
  message: string;
  element?: string;
}

interface LinkCheckEntry extends CheckEntry {
  originalUrl: string;
  finalUrl: string | null;
  statusCode: number | null;
  redirectChain: string[];
  responseTimeMs: number | null;
}

interface ImageCheckEntry extends CheckEntry {
  originalUrl: string;
  finalUrl: string | null;
  statusCode: number | null;
  redirectChain: string[];
  responseTimeMs: number | null;
}

interface SpamScoreResult {
  score: number;
  details: CheckEntry[];
}

type ValidationData = {
  overallScore: OverallScore;
  linkChecks: LinkCheckEntry[];
  imageChecks: ImageCheckEntry[];
  spamScore: SpamScoreResult;
  htmlIssues: CheckEntry[];
  compatIssues: CheckEntry[];
  a11yIssues: CheckEntry[];
};

function countBySeverity(items: CheckEntry[]) {
  return {
    errors: items.filter((i) => i.severity === "error").length,
    warnings: items.filter((i) => i.severity === "warning").length,
    infos: items.filter((i) => i.severity === "info").length,
  };
}

function allIssues(v: ValidationData): CheckEntry[] {
  return [
    ...v.linkChecks,
    ...v.imageChecks,
    ...v.spamScore.details,
    ...v.htmlIssues,
    ...v.compatIssues,
    ...v.a11yIssues,
  ];
}

function ScoreHeader({ score }: { score: OverallScore }) {
  const config = {
    green: {
      bg: "bg-[#e8f5e9] dark:bg-green-950/30",
      iconBg: "bg-[#e8f5e9]",
      iconColor: "text-[#2e7d32]",
      title: "Validation Pass",
    },
    yellow: {
      bg: "bg-[#fff9e6] dark:bg-amber-950/30",
      iconBg: "bg-[#fff9e6]",
      iconColor: "text-amber-600",
      title: "Warnings Found",
    },
    red: {
      bg: "bg-[#fee2e2] dark:bg-red-950/30",
      iconBg: "bg-[#fee2e2]",
      iconColor: "text-red-600",
      title: "Validation Failed",
    },
  }[score];

  const Icon = score === "green" ? CheckCircle : score === "yellow" ? AlertTriangle : XCircle;

  return (
    <div className="p-6 border-b border-[rgba(123,122,129,0.1)]">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-[#323238] dark:text-zinc-100">{config.title}</h3>
      </div>
    </div>
  );
}

function SummaryBar({ errors, warnings, infos }: { errors: number; warnings: number; infos: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-6 pb-4">
      <div className={`p-2 rounded text-center ${errors > 0 ? "bg-[#fee2e2]" : "bg-[#f6f2f7] dark:bg-zinc-800"}`}>
        <span className="block font-label text-[10px] font-bold text-[#7b7a81] uppercase">Errors</span>
        <span className={`font-label text-sm ${errors > 0 ? "text-red-600" : "text-[#b3b1b8]"}`}>{errors}</span>
      </div>
      <div className={`p-2 rounded text-center ${warnings > 0 ? "bg-[#fff9e6]" : "bg-[#f6f2f7] dark:bg-zinc-800"}`}>
        <span className="block font-label text-[10px] font-bold text-[#7b7a81] uppercase">Warning</span>
        <span className={`font-label text-sm ${warnings > 0 ? "text-[#856404]" : "text-[#b3b1b8]"}`}>{warnings}</span>
      </div>
      <div className="bg-[#f6f2f7] dark:bg-zinc-800 p-2 rounded text-center">
        <span className="block font-label text-[10px] font-bold text-[#7b7a81] uppercase">Info</span>
        <span className="font-label text-sm text-[#5f5e65] dark:text-zinc-400">{infos}</span>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  items,
  statusText,
}: {
  label: string;
  items: CheckEntry[];
  statusText?: string;
}) {
  const [open, setOpen] = useState(false);
  const counts = countBySeverity(items);
  const hasIssues = items.length > 0;
  const hasErrors = counts.errors > 0;
  const hasWarnings = counts.warnings > 0;

  const Icon = hasErrors ? XCircle : hasWarnings ? AlertTriangle : hasIssues && items.some(i => i.severity === "info") ? Info : CheckCircle;
  const iconColor = hasErrors ? "text-red-600" : hasWarnings ? "text-orange-600" : hasIssues && items.some(i => i.severity === "info") ? "text-blue-600" : "text-green-600";

  // Expanded style for items with warnings/errors
  const hasCritical = hasErrors || hasWarnings;

  if (hasCritical) {
    return (
      <div className={`p-4 rounded-lg ${hasErrors ? "bg-red-50/50 dark:bg-red-950/10 border-l-4 border-red-400" : "bg-orange-50/50 dark:bg-amber-950/10 border-l-4 border-orange-400"}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between mb-0"
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#0e0e10] dark:text-zinc-100">{label}</span>
          </div>
          {open ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#7b7a81]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#7b7a81]" />
          )}
        </button>
        {open && (
          <div className="pl-7 mt-2 space-y-2">
            {items.map((item, i) => (
              <div key={i} className={`p-2 rounded text-[11px] font-label border ${
                item.severity === "error"
                  ? "bg-red-100/50 text-red-900 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                  : item.severity === "warning"
                  ? "bg-orange-100/50 text-orange-900 border-orange-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                  : "bg-blue-50/50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
              }`}>
                {item.message}
                {item.element && (
                  <span className="ml-1 text-[10px] text-[#7b7a81]">({item.element})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => hasIssues && setOpen((v) => !v)}
      className="w-full flex items-center justify-between p-4 hover:bg-[#f6f2f7] dark:hover:bg-zinc-800/50 rounded-lg transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-xs font-bold uppercase tracking-widest text-[#5f5e65] dark:text-zinc-400 group-hover:text-[#0e0e10] dark:group-hover:text-zinc-100">
          {label}
        </span>
      </div>
      <span className="text-[10px] font-label text-[#7b7a81] uppercase tracking-wider">
        {statusText ?? (hasIssues ? `${items.length} items` : "Valid")}
      </span>
    </button>
  );
}

export function ValidationResult({
  validation,
  onRecheck,
  recheckLoading,
  compact,
}: {
  validation: ValidationData;
  onRecheck?: () => void;
  recheckLoading?: boolean;
  compact?: boolean;
}) {
  const issues = allIssues(validation);
  const totalErrors = issues.filter((i) => i.severity === "error").length;
  const totalWarnings = issues.filter((i) => i.severity === "warning").length;
  const totalInfos = issues.filter((i) => i.severity === "info").length;

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl ghost-border overflow-hidden ambient-shadow flex flex-col ${compact ? "h-full" : ""}`}>
      <ScoreHeader score={validation.overallScore} />

      <SummaryBar errors={totalErrors} warnings={totalWarnings} infos={totalInfos} />

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          <CategoryRow
            label="Links"
            items={validation.linkChecks}
            statusText={validation.linkChecks.length > 0 ? `${validation.linkChecks.length} checked` : "Valid"}
          />
          <CategoryRow
            label="Images"
            items={validation.imageChecks}
            statusText={validation.imageChecks.length > 0 ? "Alt text set" : "Valid"}
          />
          <CategoryRow
            label="Spam Score"
            items={validation.spamScore.details}
            statusText={`${validation.spamScore.score}/10`}
          />
          <CategoryRow label="HTML Structure" items={validation.htmlIssues} />
          <CategoryRow
            label="Compatibility"
            items={validation.compatIssues}
            statusText={validation.compatIssues.length === 0 ? "Outlook/Gmail" : undefined}
          />
          <CategoryRow
            label="Accessibility"
            items={validation.a11yIssues}
            statusText={validation.a11yIssues.length === 0 ? "Details" : undefined}
          />
        </div>
      </div>

      {/* Re-check */}
      {onRecheck && (
        <div className="p-4 bg-[#f6f2f7] dark:bg-zinc-800/30">
          <button
            onClick={onRecheck}
            disabled={recheckLoading}
            className="w-full bg-white dark:bg-zinc-900 text-[#0e0e10] dark:text-zinc-100 border border-[rgba(123,122,129,0.3)] py-3 rounded font-bold text-xs uppercase tracking-[0.2em] shadow-sm hover:bg-[#f0edf2] dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${recheckLoading ? "animate-spin" : ""}`} />
            Re-Check Validation
          </button>
        </div>
      )}
    </div>
  );
}
