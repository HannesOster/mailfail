import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Trash2, Search, CheckCircle, AlertTriangle, XCircle, Mail } from "lucide-react";
import { timeAgo, copyToClipboard } from "../lib/utils";
import { useEmailStream } from "../hooks/use-inbox-stream";
import { Copy, Check } from "lucide-react";
import { useRef } from "react";

type OverallScore = "green" | "yellow" | "red";

type SpamScoreResult = {
  score: number;
  details: { severity: string; message: string }[];
};

type Email = {
  id: string;
  from: string;
  subject: string | null;
  textBody?: string | null;
  isRead: boolean;
  receivedAt: Date;
};

type ValidationEntry = {
  emailId: string | null;
  overallScore: OverallScore;
  spamScore: SpamScoreResult;
};

function SpamBadge({ score }: { score: number }) {
  const isLow = score <= 3;
  const isMed = score > 3 && score <= 6;

  const colorClasses = isLow
    ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50"
    : isMed
    ? "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800/50"
    : "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50";

  const dotColor = isLow ? "bg-green-500" : isMed ? "bg-yellow-500" : "bg-red-500";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />
      {score}
    </span>
  );
}

function StatusIcon({ score }: { score: OverallScore }) {
  if (score === "green") {
    return <CheckCircle className="w-5 h-5 text-green-500 fill-green-500" />;
  }
  if (score === "yellow") {
    return <AlertTriangle className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
  }
  return <XCircle className="w-5 h-5 text-red-500 fill-red-500" />;
}

function SmtpEmptyState() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const smtpEnv = "SMTP_HOST=localhost\nSMTP_PORT=2525\nSMTP_USER=dev\nSMTP_PASS=dev";

  function handleCopy() {
    copyToClipboard(smtpEnv);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 bg-[#f0edf2] dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
        <Mail className="w-8 h-8 text-[#7b7a81]" />
      </div>
      <p className="text-[#5f5e65] dark:text-zinc-400 text-sm mb-8 max-w-md text-center">
        No emails yet. Send a test email using the SMTP credentials.
      </p>
      <div className="bg-[#0e0e10] rounded-xl p-5 max-w-sm w-full text-left relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <div className="font-mono text-sm space-y-1.5">
          <div><span className="text-zinc-500">SMTP_HOST=</span><span className="text-zinc-200">localhost</span></div>
          <div><span className="text-zinc-500">SMTP_PORT=</span><span className="text-zinc-200">2525</span></div>
          <div><span className="text-zinc-500">SMTP_USER=</span><span className="text-amber-300">dev</span></div>
          <div><span className="text-zinc-500">SMTP_PASS=</span><span className="text-amber-300">dev</span></div>
        </div>
      </div>
    </div>
  );
}

export function EmailListPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [validations, setValidations] = useState<ValidationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const newEmailTrigger = useEmailStream();

  useEffect(() => {
    fetch("/api/emails")
      .then((r) => r.json())
      .then((data) => setEmails(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (newEmailTrigger === 0) return;
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEmailTrigger]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/emails");
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDeleteAll() {
    if (!confirm("Delete all emails in this inbox?")) return;
    await fetch("/api/emails", { method: "DELETE" });
    setEmails([]);
    setValidations([]);
  }

  const filteredEmails = emails.filter((email) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      email.from.toLowerCase().includes(q) ||
      (email.subject ?? "").toLowerCase().includes(q) ||
      (email.textBody ?? "").toLowerCase().includes(q)
    );
  });

  const validationMap = new Map(validations.map((v) => [v.emailId, v]));
  const unreadCount = emails.filter((e) => !e.isRead).length;

  if (loading) {
    return (
      <div className="text-center py-16 text-[#7b7a81] text-sm">Loading...</div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#323238] dark:text-zinc-100">Inbox</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-[10px] font-black font-mono uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
        <SmtpEmptyState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-[#323238] dark:text-zinc-100">Inbox</h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] font-black font-mono uppercase tracking-wider">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="h-6 w-6 rounded-full bg-[#5f5e60] text-[10px] flex items-center justify-center text-white border-2 border-[var(--background)] font-bold">
              {unreadCount}
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-[#5f5e65] hover:text-[#323238] dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-semibold hover:opacity-75 transition-opacity px-3 py-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        </div>
      </div>

      {/* Email Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ambient-shadow overflow-hidden">
        {/* Search */}
        <div className="px-6 py-3 border-b border-[rgba(123,122,129,0.1)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b3b1b8] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by sender, subject, or body..."
              className="w-full bg-[#f6f2f7] dark:bg-zinc-800/50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#5f5e60]/20 placeholder:text-[#b3b1b8] transition-all text-[#323238] dark:text-zinc-100"
            />
          </div>
        </div>

        {filteredEmails.length === 0 && search ? (
          <div className="text-center py-12 text-[#7b7a81] text-sm">
            No emails matching &ldquo;{search}&rdquo;
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-widest text-[#b3b1b8] border-b border-[rgba(123,122,129,0.1)]">
                  <th className="px-6 py-4 w-8" />
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(123,122,129,0.05)]">
                {filteredEmails.map((email) => {
                  const validation = validationMap.get(email.id);
                  const spamScore = validation?.spamScore;
                  const overallScore = validation?.overallScore;
                  return (
                    <tr
                      key={email.id}
                      className={`hover:bg-[#f6f2f7] dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer relative ${
                        email.isRead ? "bg-white/50 dark:bg-zinc-900/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        {!email.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-mono ${
                        !email.isRead
                          ? "font-bold text-[#323238] dark:text-zinc-100"
                          : "text-[#5f5e65] dark:text-zinc-400"
                      }`}>
                        <Link to={`/emails/${email.id}`} className="absolute inset-0" />
                        {email.from}
                      </td>
                      <td className={`px-6 py-4 ${
                        !email.isRead
                          ? "font-bold text-[#323238] dark:text-zinc-100"
                          : "text-[#5f5e65] dark:text-zinc-400"
                      }`}>
                        {email.subject ?? "(no subject)"}
                      </td>
                      <td className="px-6 py-4">
                        {spamScore != null ? (
                          <SpamBadge score={spamScore.score} />
                        ) : (
                          <span className="text-[#b3b1b8] text-xs">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {overallScore ? (
                          <StatusIcon score={overallScore} />
                        ) : (
                          <span className="text-[#b3b1b8] text-xs">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-[#b3b1b8] text-xs font-mono">
                        {timeAgo(new Date(email.receivedAt))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <footer className="mt-auto bg-[#f5f5f5] dark:bg-zinc-800/30 border-t border-[rgba(123,122,129,0.15)] h-10 flex items-center justify-end px-6 -mx-8 -mb-8 sticky bottom-0 z-40">
        <div className="flex items-center gap-2 text-[#323238] dark:text-zinc-300 font-bold">
          <Mail className="w-4 h-4" />
          <span className="text-[10px] font-mono tracking-tight">
            {filteredEmails.length}{search ? ` of ${emails.length}` : ""} MESSAGES
          </span>
        </div>
      </footer>
    </div>
  );
}
