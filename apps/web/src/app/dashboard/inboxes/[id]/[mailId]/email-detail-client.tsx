"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw } from "lucide-react";
import { ValidationResult } from "@/components/validation/validation-result";
import type { LinkCheckEntry, ImageCheckEntry, SpamScoreResult, CheckEntry, OverallScore } from "@mailfail/shared";

type Email = {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
  rawSource: string;
  receivedAt: Date;
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

type Tab = "html" | "text" | "raw" | "validation";

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EmailDetailClient({
  inboxId,
  inboxName,
  email,
  initialValidation,
  smtpHost,
  smtpUser,
}: {
  inboxId: string;
  inboxName: string;
  email: Email;
  initialValidation: ValidationData;
  smtpHost: string;
  smtpUser: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("html");
  const [validation, setValidation] = useState(initialValidation);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");

  async function handleDelete() {
    if (!confirm("Delete this email?")) return;
    await fetch(`/api/inboxes/${inboxId}/emails/${email.id}`, { method: "DELETE" });
    router.push(`/dashboard/inboxes/${inboxId}`);
  }

  async function handleRecheck() {
    setRecheckLoading(true);
    try {
      const res = await fetch(`/api/inboxes/${inboxId}/emails/${email.id}/recheck`, {
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "html", label: "HTML" },
    { id: "text", label: "Text" },
    { id: "raw", label: "Raw" },
    { id: "validation", label: "Validation" },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider mb-6">
        <Link href="/dashboard/inboxes" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">Inboxes</Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <Link href={`/dashboard/inboxes/${inboxId}`} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          {inboxName}
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold truncate max-w-[200px]">{email.subject}</span>
      </div>

      {/* Metadata Row */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[13px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter text-[10px] font-bold">From</span>
            <span className="text-zinc-800 dark:text-zinc-200">{email.from}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter text-[10px] font-bold">To</span>
            <span className="text-zinc-800 dark:text-zinc-200">{email.to.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter text-[10px] font-bold">Received</span>
            <span className="text-zinc-600 dark:text-zinc-400">{formatDate(new Date(email.receivedAt))}</span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors text-sm font-medium border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Preview Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-1 py-3 text-sm font-medium border-b-2 -mb-[2px] transition-all ${
                  tab === id
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {label}
                {id === "validation" && validation && (
                  <span
                    className={`ml-1.5 inline-block w-2 h-2 rounded-full ${
                      validation.overallScore === "green"
                        ? "bg-green-500"
                        : validation.overallScore === "yellow"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "html" && (
            <div className="bg-zinc-100/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 min-h-[500px] shadow-inner">
              {email.htmlBody ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setPreviewWidth("desktop")}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${previewWidth === "desktop" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                    >
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewWidth("mobile")}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${previewWidth === "mobile" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                    >
                      Mobile (375px)
                    </button>
                  </div>
                  <iframe
                    srcDoc={email.htmlBody}
                    className={`${previewWidth === "mobile" ? "w-[375px] mx-auto" : "w-full"} h-[600px] bg-white rounded-lg border border-zinc-200 dark:border-zinc-700 shadow transition-all`}
                    sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    title="Email HTML preview"
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-zinc-400 dark:text-zinc-500 text-sm">
                  No HTML content
                </div>
              )}
            </div>
          )}

          {tab === "text" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 min-h-[400px]">
              {email.textBody ? (
                <pre className="font-mono text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                  {email.textBody}
                </pre>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No plain text content</p>
              )}
            </div>
          )}

          {tab === "raw" && (
            <div className="bg-zinc-950 rounded-xl p-6 min-h-[400px] overflow-auto">
              <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap break-words">
                {email.rawSource}
              </pre>
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
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">No validation results yet.</p>
                  <button
                    onClick={handleRecheck}
                    disabled={recheckLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${recheckLoading ? "animate-spin" : ""}`} />
                    Run Validation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Validation Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {validation && (
            <ValidationResult
              validation={validation}
              onRecheck={handleRecheck}
              recheckLoading={recheckLoading}
            />
          )}

          {/* SMTP Credentials */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
              SMTP Credentials
            </h4>
            <div className="bg-zinc-950 rounded-lg p-4 font-mono text-[11px] space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Host:</span>
                <span className="text-zinc-200">{smtpHost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Port:</span>
                <span className="text-zinc-200">2525</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Username:</span>
                <span className="text-zinc-200 truncate ml-2 max-w-[140px]">{smtpUser}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
