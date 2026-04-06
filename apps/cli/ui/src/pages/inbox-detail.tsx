import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { RefreshCw, Trash2, Search, Mail } from "lucide-react";
import { timeAgo } from "../lib/utils";
import { useInboxStream } from "../hooks/use-inbox-stream";

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

type Inbox = {
  id: string;
  name: string;
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

export function InboxDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [validations, setValidations] = useState<ValidationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const newEmailTrigger = useInboxStream(id!);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/inboxes/${id}`).then((r) => r.json()),
      fetch(`/api/inboxes/${id}/emails`).then((r) => r.json()),
    ])
      .then(([inboxData, emailsData]) => {
        setInbox(inboxData);
        setEmails(emailsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (newEmailTrigger === 0) return;
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEmailTrigger]);

  async function handleRefresh() {
    if (!id) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/inboxes/${id}/emails`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDeleteAll() {
    if (!id) return;
    if (!confirm("Delete all emails in this inbox?")) return;
    await fetch(`/api/inboxes/${id}/emails`, { method: "DELETE" });
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

  if (loading) {
    return (
      <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm">Loading...</div>
    );
  }

  if (!inbox) {
    return (
      <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm">Inbox not found.</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{inbox.name}</h1>
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
              placeholder="Search by sender, subject, or body..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
        </div>

        {emails.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 px-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No emails yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 max-w-md mx-auto">
              Send a test email using the SMTP credentials. It will appear here instantly.
            </p>
            <div className="bg-zinc-950 rounded-xl p-5 max-w-md mx-auto text-left">
              <div className="font-mono text-sm space-y-1.5">
                <div><span className="text-zinc-500">SMTP_HOST=</span><span className="text-zinc-200">localhost</span></div>
                <div><span className="text-zinc-500">SMTP_PORT=</span><span className="text-zinc-200">2525</span></div>
                <div><span className="text-zinc-500">SMTP_USER=</span><span className="text-amber-300">dev</span></div>
                <div><span className="text-zinc-500">SMTP_PASS=</span><span className="text-amber-300">dev</span></div>
              </div>
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
                        {!email.isRead ? (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />
                        ) : (
                          <span className="w-2.5 h-2.5 border border-zinc-300 dark:border-zinc-600 rounded-full inline-block" />
                        )}
                      </td>
                      <td className={`py-3 px-4 ${!email.isRead ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                        <Link
                          to={`/inboxes/${id}/${email.id}`}
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
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">&mdash;</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {overallScore ? (
                          <OverallBadge score={overallScore} />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">&mdash;</span>
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
