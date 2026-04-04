export const dynamic = "force-dynamic";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getInboxCount } from "@mailfail/db/src/queries/inboxes";
import { getHtmlCheckCount } from "@mailfail/db/src/queries/html-checks";
import { listInboxes } from "@mailfail/db/src/queries/inboxes";
import { BILLING_ENABLED } from "@mailfail/shared";

export default async function SettingsPage() {
  const { user } = await requireAuth();
  const clerkUser = await currentUser();

  const [inboxCount, htmlCheckCount, inboxes] = await Promise.all([
    getInboxCount(db, user.id),
    getHtmlCheckCount(db, user.id),
    listInboxes(db, user.id),
  ]);

  const emailCount = inboxes.reduce((sum, i) => sum + i.monthlyMailCount, 0);
  const userName = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.emailAddresses[0]?.emailAddress || "Unknown"
    : user.name ?? "Unknown";
  const userEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? user.email ?? "";
  const displayName = user.name ?? userName;

  return (
    <div className="max-w-4xl w-full mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Account Settings</h2>
        <p className="text-zinc-500 text-sm">
          Manage your account, billing, and global configuration.
        </p>
      </header>

      {/* Account Section */}
      <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Account</h3>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900">{displayName}</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black text-white">
                    Admin
                  </span>
                  {BILLING_ENABLED && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-100 text-zinc-500 border border-zinc-200">
                      Free
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-100">
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Inboxes</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold">{inboxCount}</span>
                {BILLING_ENABLED && <span className="text-xs text-zinc-400">/ 1 on Free</span>}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Emails this month
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold">{emailCount}</span>
                {BILLING_ENABLED && <span className="text-xs text-zinc-400">/ 100</span>}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                HTML checks
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold">{htmlCheckCount}</span>
                {BILLING_ENABLED && <span className="text-xs text-zinc-400">/ 20</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <span className="text-sm text-zinc-400 font-mono text-xs">{user.clerkUserId}</span>
        </div>
      </section>

      {/* Members Section */}
      <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-zinc-900">Account Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-zinc-400 font-medium border-b border-zinc-100">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-4 font-medium text-zinc-900">{userName}</td>
                  <td className="py-4 text-zinc-500 font-mono text-xs">{userEmail}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-medium border border-zinc-200">
                      Admin
                    </span>
                    <span className="ml-1 text-[10px] text-zinc-400 italic">(you)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50/30 border border-red-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-6">
          <h3 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-zinc-600 max-w-md">
              This will permanently delete all inboxes, emails, and data associated with your account. This action cannot be undone.
            </p>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm font-semibold hover:bg-red-600 hover:text-white transition-all whitespace-nowrap">
              Delete Account
            </button>
          </div>
        </div>
      </section>

      <footer className="text-center pt-8 pb-12 border-t border-zinc-100">
        <p className="text-xs text-zinc-400">MailFail Settings · {displayName}</p>
      </footer>
    </div>
  );
}
