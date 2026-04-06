import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Trash2, RefreshCw, Forward, X, Send, Monitor, Smartphone } from "lucide-react";
import { formatDate } from "../lib/utils";
import { ValidationResult } from "../components/validation-result";

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

export function EmailDetailPage() {
  const { mailId } = useParams<{ mailId: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("html");
  const [validation, setValidation] = useState<ValidationData>(null);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");

  // Forward dialog state
  const [showForward, setShowForward] = useState(false);
  const [forwardTo, setForwardTo] = useState("");
  const [forwarding, setForwarding] = useState(false);
  const [forwardStatus, setForwardStatus] = useState<"idle" | "success" | "error">("idle");
  const [forwardError, setForwardError] = useState("");

  useEffect(() => {
    if (!mailId) return;
    fetch(`/api/emails/${mailId}`)
      .then((r) => r.json())
      .then((emailData) => {
        setEmail(emailData);
        if (emailData.validation) {
          setValidation(emailData.validation);
        } else {
          fetch(`/api/emails/${mailId}/recheck`, { method: "POST" })
            .then((r) => (r.ok ? r.json() : null))
            .then((v) => { if (v) setValidation(v); })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mailId]);

  async function handleDelete() {
    if (!confirm("Delete this email?")) return;
    await fetch(`/api/emails/${mailId}`, { method: "DELETE" });
    navigate("/");
  }

  async function handleRecheck() {
    setRecheckLoading(true);
    try {
      const res = await fetch(`/api/emails/${mailId}/recheck`, {
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

  async function handleForward(e: React.FormEvent) {
    e.preventDefault();
    if (!forwardTo.trim()) return;
    setForwarding(true);
    setForwardStatus("idle");
    setForwardError("");
    try {
      const res = await fetch(`/api/emails/${mailId}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: forwardTo.trim() }),
      });
      if (res.ok) {
        setForwardStatus("success");
        setTimeout(() => {
          setShowForward(false);
          setForwardTo("");
          setForwardStatus("idle");
        }, 1500);
      } else {
        const data = await res.json();
        setForwardStatus("error");
        setForwardError(data.error ?? "Failed to forward email");
      }
    } finally {
      setForwarding(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "html", label: "HTML" },
    { id: "text", label: "Text" },
    { id: "raw", label: "Raw" },
    { id: "validation", label: "Validation" },
  ];

  if (loading) {
    return (
      <div className="text-center py-16 text-[#7b7a81] text-sm">Loading...</div>
    );
  }

  if (!email) {
    return (
      <div className="text-center py-16 text-[#7b7a81] text-sm">Email not found.</div>
    );
  }

  const spamData = validation?.spamScore;
  const spamScore = spamData?.score ?? 0;
  const isLow = spamScore <= 3;
  const isMed = spamScore > 3 && spamScore <= 6;

  return (
    <div className="flex-1 flex flex-col">
      {/* Breadcrumb */}
      <nav className="font-label text-[10px] tracking-[0.2em] text-[#7b7a81] mb-2 uppercase">
        <Link to="/" className="hover:text-[#323238] dark:hover:text-zinc-100 transition-colors">
          Inbox
        </Link>
        {" / "}
        <span className="text-[#323238] dark:text-zinc-100">{email.subject?.toUpperCase()}</span>
      </nav>

      {/* Title */}
      <h2 className="text-4xl font-extrabold tracking-tighter text-[#0e0e10] dark:text-zinc-100 mb-8">
        {email.subject}
      </h2>

      {/* Spam Score Banner */}
      {validation && (
        <section className={`mb-8 p-6 rounded-xl flex items-center justify-between ambient-shadow border ${
          isLow
            ? "bg-[#f2faf4] border-[#d1e7d8] dark:bg-green-950/20 dark:border-green-800/50"
            : isMed
            ? "bg-[#fffbf0] border-[#f0e0b0] dark:bg-amber-950/20 dark:border-amber-800/50"
            : "bg-[#fef2f2] border-[#f0c8c8] dark:bg-red-950/20 dark:border-red-800/50"
        }`}>
          <div className="flex items-center gap-8">
            <div className="flex items-baseline gap-1">
              <span className={`text-6xl font-black font-label ${
                isLow ? "text-[#2e7d32]" : isMed ? "text-[#f59e0b]" : "text-[#dc2626]"
              }`}>
                {spamScore}
              </span>
              <span className={`text-xs font-bold uppercase tracking-widest ${
                isLow ? "text-[#2e7d32]/70" : isMed ? "text-[#f59e0b]/70" : "text-[#dc2626]/70"
              }`}>
                /10
              </span>
            </div>
            <div className={`h-12 w-px ${
              isLow ? "bg-[#d1e7d8]" : isMed ? "bg-[#f0e0b0]" : "bg-[#f0c8c8]"
            }`} />
            <div>
              <h3 className={`text-lg font-bold mb-1 flex items-center gap-2 ${
                isLow ? "text-[#1b5e20]" : isMed ? "text-[#92400e]" : "text-[#991b1b]"
              }`}>
                Spam Risk: {isLow ? "Low" : isMed ? "Medium" : "High"}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-label border ${
                  isLow
                    ? "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
                    : isMed
                    ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                    : "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
                }`}>
                  {isLow ? "HEALTHY" : isMed ? "CAUTION" : "RISKY"}
                </span>
              </h3>
              {spamData && spamData.details.length > 0 && (
                <ul className={`flex flex-wrap gap-x-6 gap-y-1 text-sm ${
                  isLow ? "text-[#388e3c]" : isMed ? "text-[#b45309]" : "text-[#dc2626]"
                }`}>
                  {spamData.details.slice(0, 3).map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-xs">&#8250;</span> {d.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Metadata & Forward */}
      <div className="mb-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl ghost-border ambient-shadow">
          <div className="flex flex-wrap gap-y-4 justify-between items-start mb-0">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-[#7b7a81] font-label">From:</span>
                <span className="font-label text-sm font-medium text-[#0e0e10] dark:text-zinc-100 bg-[#f6f2f7] dark:bg-zinc-800 px-2 py-1 rounded">
                  {email.from}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-[#7b7a81] font-label">To:</span>
                <span className="font-label text-sm font-medium text-[#0e0e10] dark:text-zinc-100">
                  {email.to.join(", ")}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-[#7b7a81] font-label">Date:</span>
                <span className="font-label text-sm text-[#5f5e65] dark:text-zinc-400">
                  {formatDate(new Date(email.receivedAt))}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForward((v) => !v)}
                className="px-4 py-2 rounded border border-[rgba(123,122,129,0.3)] text-xs font-bold uppercase tracking-widest hover:bg-[#f0edf2] dark:hover:bg-zinc-800 transition-all flex items-center gap-2 text-[#323238] dark:text-zinc-300"
              >
                <Forward className="w-4 h-4" /> Forward
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded border border-red-200/30 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          {/* Forward Dialog (Expanded) */}
          {showForward && (
            <div className="mt-6 pt-6 border-t border-[rgba(123,122,129,0.1)]">
              <div className="bg-[#f6f2f7] dark:bg-zinc-800 rounded-lg p-4">
                <form onSubmit={handleForward} className="flex items-center gap-3">
                  <input
                    autoFocus
                    type="email"
                    value={forwardTo}
                    onChange={(e) => setForwardTo(e.target.value)}
                    placeholder="recipient@example.com"
                    className="flex-1 bg-white dark:bg-zinc-900 border border-[rgba(123,122,129,0.3)] rounded-md py-2 px-3 text-sm focus:ring-[#5f5e60]/40 text-[#323238] dark:text-zinc-100 placeholder:text-[#b3b1b8]"
                  />
                  <button
                    type="submit"
                    disabled={forwarding || !forwardTo.trim()}
                    className="bg-[#5f5e60] text-white px-6 py-2 rounded-md font-bold text-sm tracking-tight shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 inline mr-1.5" />
                    {forwarding ? "Sending..." : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForward(false); setForwardTo(""); setForwardStatus("idle"); setForwardError(""); }}
                    className="text-[#5f5e65] text-sm px-2 hover:text-[#323238] dark:hover:text-zinc-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
                {forwardStatus === "success" && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">Email forwarded successfully.</p>
                )}
                {forwardStatus === "error" && (
                  <p className="mt-2 text-xs text-red-500">{forwardError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Content Preview (Left) */}
        <div className="w-full lg:w-8/12">
          <div className="bg-white dark:bg-zinc-900 rounded-xl ghost-border overflow-hidden flex flex-col h-[700px] ambient-shadow">
            {/* Tab Header */}
            <div className="bg-[#f6f2f7] dark:bg-zinc-800 px-6 pt-4 flex justify-between items-end">
              <div className="flex gap-6">
                {tabs.map(({ id: tabId, label }) => (
                  <button
                    key={tabId}
                    onClick={() => setTab(tabId)}
                    className={`pb-3 border-b-2 font-bold text-xs uppercase tracking-widest transition-all ${
                      tab === tabId
                        ? "border-[#5f5e60] text-[#0e0e10] dark:text-zinc-100"
                        : "border-transparent text-[#7b7a81] hover:text-[#323238] dark:hover:text-zinc-300"
                    }`}
                  >
                    {label}
                    {tabId === "validation" && validation && (
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
              {tab === "html" && (
                <div className="pb-3 flex bg-[#f0edf2] dark:bg-zinc-700 p-1 rounded-lg mb-1">
                  <button
                    onClick={() => setPreviewWidth("desktop")}
                    className={`p-1.5 rounded transition-all ${
                      previewWidth === "desktop"
                        ? "bg-white dark:bg-zinc-900 shadow-sm text-[#0e0e10] dark:text-zinc-100"
                        : "text-[#7b7a81] hover:text-[#323238] dark:hover:text-zinc-300"
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewWidth("mobile")}
                    className={`p-1.5 rounded transition-all ${
                      previewWidth === "mobile"
                        ? "bg-white dark:bg-zinc-900 shadow-sm text-[#0e0e10] dark:text-zinc-100"
                        : "text-[#7b7a81] hover:text-[#323238] dark:hover:text-zinc-300"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {tab === "html" && (
                <div className="bg-[#f0edf2] dark:bg-zinc-800/50 p-8 min-h-full">
                  {email.htmlBody ? (
                    previewWidth === "mobile" ? (
                      /* Mobile preview with phone frame */
                      <div className="max-w-[400px] mx-auto bg-white rounded-[3rem] p-4 shadow-2xl border-[8px] border-[#0e0e10] min-h-[500px]">
                        <div className="w-24 h-6 bg-[#0e0e10] mx-auto rounded-b-xl mb-4" />
                        <iframe
                          srcDoc={email.htmlBody}
                          className="w-full h-[500px] bg-white rounded-lg border-none"
                          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                          title="Email HTML preview (mobile)"
                        />
                      </div>
                    ) : (
                      <iframe
                        srcDoc={email.htmlBody}
                        className="w-full h-[600px] bg-white rounded-lg border border-[rgba(123,122,129,0.15)] shadow-sm transition-all"
                        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        title="Email HTML preview"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-[#7b7a81] text-sm">
                      No HTML content
                    </div>
                  )}
                </div>
              )}

              {tab === "text" && (
                <div className="p-6 min-h-[400px]">
                  {email.textBody ? (
                    <pre className="font-mono text-sm text-[#5f5e65] dark:text-zinc-300 whitespace-pre-wrap break-words">
                      {email.textBody}
                    </pre>
                  ) : (
                    <p className="text-[#7b7a81] text-sm">No plain text content</p>
                  )}
                </div>
              )}

              {tab === "raw" && (
                <div className="bg-[#0e0e10] p-6 min-h-[400px] overflow-auto">
                  <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap break-words">
                    {email.rawSource}
                  </pre>
                </div>
              )}

              {tab === "validation" && (
                <div className="p-6">
                  {validation ? (
                    <ValidationResult
                      validation={validation}
                      onRecheck={handleRecheck}
                      recheckLoading={recheckLoading}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-[#7b7a81] text-sm mb-4">No validation results yet.</p>
                      <button
                        onClick={handleRecheck}
                        disabled={recheckLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#5f5e60] text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${recheckLoading ? "animate-spin" : ""}`} />
                        Run Validation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Sidebar (Right) */}
        <div className="w-full lg:w-4/12">
          {validation && (
            <div className="h-[700px] flex flex-col">
              <ValidationResult
                validation={validation}
                onRecheck={handleRecheck}
                recheckLoading={recheckLoading}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
