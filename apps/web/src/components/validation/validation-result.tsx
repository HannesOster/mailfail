"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronRight, RefreshCw } from "lucide-react";
import type {
  OverallScore,
  CheckEntry,
  LinkCheckEntry,
  ImageCheckEntry,
  SpamScoreResult,
} from "@mailfail/shared";

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
  if (score === "green") {
    return (
      <div className="p-6 bg-green-50/50 border-b border-green-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
          <CheckCircle className="w-7 h-7 fill-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-green-900 leading-tight">Validation Pass</h3>
          <p className="text-xs text-green-700 mt-0.5">All checks passed</p>
        </div>
      </div>
    );
  }
  if (score === "yellow") {
    return (
      <div className="p-6 bg-amber-50/50 border-b border-amber-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-900 leading-tight">Warnings Found</h3>
          <p className="text-xs text-amber-700 mt-0.5">Some issues need attention</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 bg-red-50/50 border-b border-red-100 flex items-center gap-4">
      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
        <XCircle className="w-7 h-7 fill-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-red-900 leading-tight">Validation Failed</h3>
        <p className="text-xs text-red-700 mt-0.5">Critical issues detected</p>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  items,
  extra,
}: {
  label: string;
  items: CheckEntry[];
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const counts = countBySeverity(items);
  const hasIssues = items.length > 0;
  const hasErrors = counts.errors > 0;
  const hasWarnings = counts.warnings > 0;

  const icon = hasErrors ? (
    <XCircle className="w-5 h-5 text-red-500 fill-red-500" />
  ) : hasWarnings ? (
    <AlertTriangle className="w-5 h-5 text-amber-500" />
  ) : (
    <CheckCircle className="w-5 h-5 text-green-500 fill-green-500" />
  );

  const bgClass = hasErrors
    ? "bg-red-50/20 hover:bg-red-50"
    : hasWarnings
    ? "bg-amber-50/20 hover:bg-amber-50"
    : "hover:bg-zinc-50";

  return (
    <div className={`${bgClass} transition-colors`}>
      <button
        onClick={() => hasIssues && setOpen((v) => !v)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-semibold">{label}</span>
          {extra}
          {counts.errors > 0 && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
              {counts.errors} error{counts.errors > 1 ? "s" : ""}
            </span>
          )}
          {counts.warnings > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
              {counts.warnings} warning{counts.warnings > 1 ? "s" : ""}
            </span>
          )}
          {!hasIssues && (
            <span className="text-xs text-zinc-400">all ok</span>
          )}
        </div>
        {hasIssues && (
          <ChevronRight
            className={`w-4 h-4 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
          />
        )}
      </button>
      {open && hasIssues && (
        <div className="pl-8 pr-4 pb-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="text-xs flex items-start gap-2">
              {item.severity === "error" ? (
                <XCircle className="w-3.5 h-3.5 text-red-500 fill-red-500 mt-0.5 shrink-0" />
              ) : item.severity === "warning" ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              ) : (
                <Info className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
              )}
              <span
                className={
                  item.severity === "error"
                    ? "text-red-800"
                    : item.severity === "warning"
                    ? "text-amber-800"
                    : "text-zinc-500"
                }
              >
                {item.message}
                {item.element && (
                  <span className="ml-1 font-mono text-[10px] text-zinc-400">({item.element})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ValidationResult({
  validation,
  onRecheck,
  recheckLoading,
}: {
  validation: ValidationData;
  onRecheck?: () => void;
  recheckLoading?: boolean;
}) {
  const issues = allIssues(validation);
  const totalErrors = issues.filter((i) => i.severity === "error").length;
  const totalWarnings = issues.filter((i) => i.severity === "warning").length;
  const totalInfos = issues.filter((i) => i.severity === "info").length;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <ScoreHeader score={validation.overallScore} />

      {/* Summary */}
      <div className="px-6 py-3 border-b border-zinc-100 flex gap-4 font-mono text-[11px] font-bold">
        <span className="text-red-600">{totalErrors} ERRORS</span>
        <span className="text-amber-600">{totalWarnings} WARNINGS</span>
        <span className="text-zinc-500">{totalInfos} INFO</span>
      </div>

      {/* Categories */}
      <div className="divide-y divide-zinc-100">
        <CategoryRow
          label="Links"
          items={validation.linkChecks}
          extra={
            validation.linkChecks.length > 0 ? (
              <span className="text-xs text-zinc-400">
                ({validation.linkChecks.length} checked)
              </span>
            ) : undefined
          }
        />
        <CategoryRow
          label="Images"
          items={validation.imageChecks}
          extra={
            validation.imageChecks.length > 0 ? (
              <span className="text-xs text-zinc-400">
                ({validation.imageChecks.length} checked)
              </span>
            ) : undefined
          }
        />
        <CategoryRow
          label="Spam Score"
          items={validation.spamScore.details}
          extra={
            <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded">
              {validation.spamScore.score}/10
            </span>
          }
        />
        <CategoryRow label="HTML" items={validation.htmlIssues} />
        <CategoryRow label="Compatibility" items={validation.compatIssues} />
        <CategoryRow label="Accessibility" items={validation.a11yIssues} />
      </div>

      {/* Re-check */}
      {onRecheck && (
        <div className="p-4 bg-zinc-50 border-t border-zinc-100">
          <button
            onClick={onRecheck}
            disabled={recheckLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 text-white rounded font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${recheckLoading ? "animate-spin" : ""}`} />
            Re-Check
          </button>
        </div>
      )}
    </div>
  );
}
