"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Copy, RefreshCw, Trash2, Check, Search, Mail } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useInboxStream } from "@/lib/hooks";
import type { SpamScoreResult, OverallScore } from "@mailfail/shared";

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

type Inbox = {
  id: string;
  name: string;
  smtpUser: string;
  smtpPass: string;
  monthlyMailCount: number;
};

function SpamBadge({ score }: { score: number }) {
  if (score <= 3) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        {score}
      </span>
    );
  }
  if (score <= 6) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <span className="w-2 h-2 bg-amber-500 rounded-full" />
        {score}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      <span className="w-2 h-2 bg-red-500 rounded-full" />
      {score}
    </span>
  );
}

function OverallBadge({ score }: { score: string }) {
  if (score === "green") {
    return <span className="w-3 h-3 bg-green-500 rounded-full inline-block" title="Passed" />;
  }
  if (score === "yellow") {
    return <span className="w-3 h-3 bg-amber-500 rounded-full inline-block" title="Warnings" />;
  }
  return <span className="w-3 h-3 bg-red-500 rounded-full inline-block" title="Issues" />;
}

export function DashboardClient({
  inbox,
  initialEmails,
  initialValidations,
  smtpHost,
}: {
  inbox: Inbox;
  initialEmails: Email[];
  initialValidations: ValidationEntry[];
  smtpHost: string;
}) {
  const [emails, setEmails] = useState(initialEmails);
  const [validations, setValidations] = useState<ValidationEntry[]>(initialValidations);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);
  const newEmailTrigger = useInboxStream(inbox.id);

  useEffect(() => {
    if (newEmailTrigger === 0) return;
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEmailTrigger]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/inboxes/${inbox.id}/emails`);
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
    await fetch(`/api/inboxes/${inbox.id}/emails`, { method: "DELETE" });
    setEmails([]);
    setValidations([]);
  }

  function handleCopyEnv() {
    const text = `SMTP_HOST=${smtpHost}\nSMTP_PORT=2525\nSMTP_USER=${inbox.smtpUser}\nSMTP_PASS=${inbox.smtpPass}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggleRead(emailId: string, currentIsRead: boolean) {
    const newIsRead = !currentIsRead;
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isRead: newIsRead } : e)),
    );
    await fetch(`/api/inbox/emails/${emailId}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: newIsRead }),
    }).catch(() => {
      // Revert on failure
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, isRead: currentIsRead } : e)),
      );
    });
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Inbox</h1>
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-[11px] font-bold border border-green-200/50 dark:border-green-800/50">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleDeleteAll}
            className="px-3 py-1.5 text-sm border border-red-100 dark:border-red-900/50 text-red-600 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        </div>
      </div>

      {/* SMTP Credentials Block */}
      <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
            SMTP Credentials — paste in your .env
          </span>
          <button
            onClick={handleCopyEnv}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="font-mono text-sm space-y-1.5">
          <div>
            <span className="text-zinc-500">SMTP_HOST=</span>
            <span className="text-zinc-200">{smtpHost}</span>
          </div>
          <div>
            <span className="text-zinc-500">SMTP_PORT=</span>
            <span className="text-zinc-200">2525</span>
          </div>
          <div>
            <span className="text-zinc-500">SMTP_USER=</span>
            <span className="text-amber-300">{inbox.smtpUser}</span>
          </div>
          <div>
            <span className="text-zinc-500">SMTP_PASS=</span>
            <span className="text-amber-300">{inbox.smtpPass}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 mb-1">
            Emails This Month
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{inbox.monthlyMailCount}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 mb-1">
            Total Captured
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{emails.length}</div>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by sender, subject, or body…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
        </div>

        {emails.length === 0 ? (
          /* Empty state — no emails at all */
          <div className="text-center py-16 px-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No emails yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 max-w-md mx-auto">
              Copy the SMTP credentials above and paste them into your project&apos;s .env file. Then trigger a test email — it will appear here instantly.
            </p>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 max-w-lg mx-auto text-left">
              <h4 className="font-semibold text-sm mb-4 text-zinc-900 dark:text-zinc-100">Quick Setup</h4>
              <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md flex items-center justify-center text-xs font-bold">1</span>
                  <span>Copy the .env block above</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md flex items-center justify-center text-xs font-bold">2</span>
                  <span>Paste into your project&apos;s .env file</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md flex items-center justify-center text-xs font-bold">3</span>
                  <span>Trigger a test email from your app</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md flex items-center justify-center text-xs font-bold">4</span>
                  <span>Watch it appear here in real-time</span>
                </li>
              </ol>
            </div>
          </div>
        ) : filteredEmails.length === 0 && search ? (
          /* No search results */
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
            No emails matching &ldquo;{search}&rdquo;
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                  <th className="py-3 px-4 w-10 text-center" />
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 w-20 text-center">Score</th>
                  <th className="py-3 px-4 w-20 text-center">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredEmails.map((email) => {
                  const validation = validationMap.get(email.id);
                  const spamScore = validation?.spamScore;
                  const overallScore = validation?.overallScore;
                  return (
                    <tr
                      key={email.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer relative ${
                        !email.isRead ? "bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleRead(email.id, email.isRead);
                          }}
                          title={email.isRead ? "Mark as unread" : "Mark as read"}
                          className="relative z-10 inline-flex items-center justify-center w-5 h-5 rounded-full hover:scale-110 transition-transform"
                        >
                          {!email.isRead ? (
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                          ) : (
                            <span className="w-2.5 h-2.5 border border-zinc-300 dark:border-zinc-600 rounded-full" />
                          )}
                        </button>
                      </td>
                      <td className={`py-3 px-4 ${!email.isRead ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                        <Link
                          href={`/dashboard/inboxes/${inbox.id}/${email.id}`}
                          className="hover:underline absolute inset-0"
                        />
                        {email.from}
                      </td>
                      <td className={`py-3 px-4 ${!email.isRead ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-900 dark:text-zinc-300"}`}>
                        {email.subject ?? "(no subject)"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {spamScore != null ? (
                          <SpamBadge score={spamScore.score} />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {overallScore ? (
                          <OverallBadge score={overallScore} />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400 dark:text-zinc-500 font-medium text-xs">
                        {timeAgo(new Date(email.receivedAt))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="py-2.5 px-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{filteredEmails.length}</span>
          {search ? ` of ${emails.length}` : ""} emails
        </div>
      </div>
    </div>
  );
}
