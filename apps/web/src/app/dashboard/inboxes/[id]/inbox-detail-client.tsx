"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Trash2, RefreshCw } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type Email = {
  id: string;
  from: string;
  subject: string;
  isRead: boolean;
  receivedAt: Date;
};

type Inbox = {
  id: string;
  name: string;
  smtpUser: string;
  smtpPass: string;
  monthlyMailCount: number;
  createdAt: Date;
};

function useInboxStream(inboxId: string) {
  const [newEmailTrigger, setNewEmailTrigger] = useState(0);
  useEffect(() => {
    const eventSource = new EventSource(`/api/inboxes/${inboxId}/stream`);
    eventSource.onmessage = () => setNewEmailTrigger((prev) => prev + 1);
    return () => eventSource.close();
  }, [inboxId]);
  return newEmailTrigger;
}

export function InboxDetailClient({
  inbox,
  initialEmails,
  smtpHost,
}: {
  inbox: Inbox;
  initialEmails: Email[];
  smtpHost: string;
}) {
  const router = useRouter();
  const [emails, setEmails] = useState(initialEmails);
  const [refreshing, setRefreshing] = useState(false);
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
  }

  function copySmtp() {
    const text = `Host: ${smtpHost}\nPort: 2525\nUsername: ${inbox.smtpUser}\nPassword: ${inbox.smtpPass}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{inbox.name}</h1>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-green-200/50">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copySmtp}
            className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy SMTP
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleDeleteAll}
            className="px-3 py-1.5 text-sm border border-red-100 dark:border-red-900/50 text-red-600 font-medium rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Delete All
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                <th className="py-3 px-4 w-12 text-center" />
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 w-32 text-right">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                    No emails yet. Send test email to{" "}
                    <span className="font-mono text-zinc-600 dark:text-zinc-400">{inbox.smtpUser}</span>
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr
                    key={email.id}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer ${
                      !email.isRead ? "bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30" : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      {!email.isRead ? (
                        <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
                      ) : (
                        <span className="w-2 h-2 border border-zinc-300 dark:border-zinc-600 rounded-full inline-block" />
                      )}
                    </td>
                    <td
                      className={`py-3 px-4 ${
                        !email.isRead ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <Link
                        href={`/dashboard/inboxes/${inbox.id}/${email.id}`}
                        className="hover:underline block"
                      >
                        {email.from}
                      </Link>
                    </td>
                    <td
                      className={`py-3 px-4 ${
                        !email.isRead ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      <Link
                        href={`/dashboard/inboxes/${inbox.id}/${email.id}`}
                        className="hover:underline block"
                      >
                        {email.subject ?? "(no subject)"}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400 dark:text-zinc-500 font-medium text-xs">
                      {timeAgo(new Date(email.receivedAt))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="py-3 px-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{emails.length}</span> emails shown
          </div>
          <div className="flex gap-1">
            <button
              disabled
              className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 dark:text-zinc-400"
            >
              Previous
            </button>
            <button
              disabled
              className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 dark:text-zinc-400"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/30 dark:bg-zinc-800/30">
          <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-2">
            Emails This Month
          </div>
          <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{inbox.monthlyMailCount}</span>
        </div>
        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/30 dark:bg-zinc-800/30">
          <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-2">
            SMTP Host
          </div>
          <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">{smtpHost}</span>
        </div>
        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/30 dark:bg-zinc-800/30">
          <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-2">
            SMTP Username
          </div>
          <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate block">
            {inbox.smtpUser}
          </span>
        </div>
      </div>
    </>
  );
}
