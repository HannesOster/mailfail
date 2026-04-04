export const dynamic = "force-dynamic";

import Link from "next/link";
import { Inbox, Mail, FileCode, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { listInboxes, getInboxCount } from "@mailfail/db/src/queries/inboxes";
import { getHtmlCheckCount } from "@mailfail/db/src/queries/html-checks";
import { listEmails } from "@mailfail/db/src/queries/emails";
import { BILLING_ENABLED } from "@mailfail/shared";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function DashboardPage() {
  const { org } = await requireOrg();

  const [orgInboxes, inboxCount, htmlCheckCount] = await Promise.all([
    listInboxes(db, org.id),
    getInboxCount(db, org.id),
    getHtmlCheckCount(db, org.id),
  ]);

  // Fetch recent emails from the first inbox (or all inboxes sequentially)
  const recentEmailsByInbox = await Promise.all(
    orgInboxes.slice(0, 3).map((inbox) =>
      listEmails(db, inbox.id, { limit: 5 }).then((emails) =>
        emails.map((e) => ({ ...e, inboxId: inbox.id, inboxName: inbox.name }))
      )
    )
  );
  const recentEmails = recentEmailsByInbox
    .flat()
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .slice(0, 5);

  const emailCount = orgInboxes.reduce((sum, i) => sum + i.monthlyMailCount, 0);
  const emailLimit = 100;
  const htmlCheckLimit = 20;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Dashboard</h2>
        <Link
          href="/dashboard/inboxes"
          className="bg-zinc-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-black transition-all active:scale-95 flex items-center gap-2"
        >
          <Inbox className="w-4 h-4" />
          New Inbox
        </Link>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-zinc-50 rounded-lg">
              <Inbox className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">{inboxCount}</h3>
            <p className="text-zinc-500 text-sm">Inboxes</p>
          </div>
          {BILLING_ENABLED && <p className="mt-4 text-xs text-zinc-400">1 inbox on Free plan</p>}
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-zinc-50 rounded-lg">
              <Mail className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Usage</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">{emailCount}</h3>
            <p className="text-zinc-500 text-sm">{BILLING_ENABLED ? `/ ${emailLimit} Emails` : "Emails"}</p>
          </div>
          {BILLING_ENABLED && (
            <div className="mt-4 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 rounded-full"
                style={{ width: `${Math.min(100, (emailCount / emailLimit) * 100)}%` }}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-400 text-right">This month</p>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-zinc-50 rounded-lg">
              <FileCode className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Limits</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">{htmlCheckCount}</h3>
            <p className="text-zinc-500 text-sm">{BILLING_ENABLED ? `/ ${htmlCheckLimit} Checks` : "Checks"}</p>
          </div>
          {BILLING_ENABLED && (
            <div className="mt-4 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${Math.min(100, (htmlCheckCount / htmlCheckLimit) * 100)}%` }}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-400 text-right">
            {BILLING_ENABLED && htmlCheckCount >= htmlCheckLimit ? "Limit reached" : "This month"}
          </p>
        </div>
      </section>

      {/* Recent Emails Table */}
      <section className="bg-white border border-zinc-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="font-bold text-zinc-900">Recent Emails</h3>
          <Link
            href="/dashboard/inboxes"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50/50 text-zinc-500 font-medium">
                <th className="px-6 py-3 font-semibold">From</th>
                <th className="px-6 py-3 font-semibold">Subject</th>
                <th className="px-6 py-3 font-semibold">Inbox</th>
                <th className="px-6 py-3 font-semibold text-right">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentEmails.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 text-sm">
                    No emails yet. Send your first test email using the SMTP credentials from an inbox.
                  </td>
                </tr>
              ) : (
                recentEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-zinc-50/80 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 text-zinc-900 font-medium">
                      <Link href={`/dashboard/inboxes/${email.inboxId}/${email.id}`} className="hover:underline">
                        {email.from}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      <Link href={`/dashboard/inboxes/${email.inboxId}/${email.id}`}>
                        {email.subject ?? "(no subject)"}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/inboxes/${email.inboxId}`}>
                        <span className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded text-[11px] font-medium hover:bg-zinc-200 transition-colors">
                          {email.inboxName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-400">
                      {timeAgo(new Date(email.receivedAt))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SMTP Quick Connect */}
      {orgInboxes.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200 p-6 rounded-xl">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Quick Connect SMTP
            </h4>
            <div className="space-y-3 font-mono text-xs">
              {[
                { label: "Host", value: process.env.SMTP_HOST ?? "smtp.mailfail.dev" },
                { label: "Port", value: "2525" },
                { label: "User", value: orgInboxes[0].smtpUser },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                  <span className="text-zinc-400">{label}</span>
                  <span className="text-zinc-900 font-medium truncate max-w-[200px]">{value}</span>
                </div>
              ))}
            </div>
          </div>
          {BILLING_ENABLED && (
            <div className="bg-zinc-900 text-white p-6 rounded-xl flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <h4 className="text-sm font-bold mb-2">Upgrade to Pro</h4>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-[200px]">
                  Get dedicated IP addresses and unlimited email history for your entire team.
                </p>
              </div>
              <button className="relative z-10 mt-6 bg-white text-zinc-950 text-xs font-bold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors w-fit">
                Explore Plans
              </button>
              <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                <Mail className="w-36 h-36" />
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
