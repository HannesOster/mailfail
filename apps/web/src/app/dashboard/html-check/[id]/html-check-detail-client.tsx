"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ValidationResult } from "@/components/validation/validation-result";
import type { LinkCheckEntry, ImageCheckEntry, SpamScoreResult, CheckEntry, OverallScore } from "@mailfail/shared";
import type { HtmlCheckSource } from "@mailfail/shared";

type HtmlCheck = {
  id: string;
  name: string;
  source: HtmlCheckSource;
  htmlContent: string;
  sourceUrl: string | null;
  createdAt: Date;
};

type ValidationData = {
  overallScore: OverallScore;
  linkChecks: LinkCheckEntry[];
  imageChecks: ImageCheckEntry[];
  spamScore: SpamScoreResult;
  htmlIssues: CheckEntry[];
  compatIssues: CheckEntry[];
  a11yIssues: CheckEntry[];
} | null;

type Tab = "html" | "validation";

export function HtmlCheckDetailClient({
  check,
  initialValidation,
}: {
  check: HtmlCheck;
  initialValidation: ValidationData;
}) {
  const [tab, setTab] = useState<Tab>("html");
  const [validation, setValidation] = useState(initialValidation);
  const [recheckLoading, setRecheckLoading] = useState(false);

  async function handleRecheck() {
    setRecheckLoading(true);
    try {
      const res = await fetch(`/api/html-checks/${check.id}/recheck`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setValidation(data);
      }
    } finally {
      setRecheckLoading(false);
    }
  }

  return (
    <>
      {/* Back link */}
      <Link
        href="/dashboard/html-check"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to HTML Checks
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">{check.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">ID: {check.id.slice(0, 12)}</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Source: <span className="font-semibold capitalize">{check.source}</span>
            </span>
            {check.sourceUrl && (
              <a
                href={check.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate max-w-[200px]"
              >
                {check.sourceUrl}
              </a>
            )}
          </div>
        </div>
        {validation && (
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              validation.overallScore === "green"
                ? "bg-green-50 text-green-700 border-green-200"
                : validation.overallScore === "yellow"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {validation.overallScore === "green"
              ? "✓ Pass"
              : validation.overallScore === "yellow"
              ? "⚠ Warnings"
              : "✕ Failed"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* HTML Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 gap-6">
            {(["html", "validation"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-1 py-3 text-sm font-medium border-b-2 -mb-[2px] capitalize transition-all ${
                  tab === t
                    ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {t === "html" ? "HTML Preview" : "Validation"}
              </button>
            ))}
          </div>

          {tab === "html" && (
            <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 min-h-[500px] shadow-inner">
              <iframe
                srcDoc={check.htmlContent}
                className="w-full h-[600px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow"
                sandbox="allow-same-origin"
                title="HTML preview"
              />
            </div>
          )}

          {tab === "validation" && (
            <div>
              {validation ? (
                <ValidationResult
                  validation={validation}
                  onRecheck={handleRecheck}
                  recheckLoading={recheckLoading}
                />
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center">
                  <p className="text-zinc-500 text-sm">No validation results available.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Validation sidebar */}
        <div className="lg:col-span-5">
          {validation ? (
            <ValidationResult
              validation={validation}
              onRecheck={handleRecheck}
              recheckLoading={recheckLoading}
            />
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center">
              <p className="text-zinc-400 text-sm">Validation pending...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
