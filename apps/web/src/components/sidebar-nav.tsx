"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export function SidebarNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/inbox/unread-count")
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});
  }, [pathname]);

  const isInboxActive =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/inboxes");

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 bg-zinc-950 h-screen w-64 border-r border-zinc-800 z-50">
      {/* Logo */}
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-zinc-950 fill-zinc-950" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">MailFail</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            Developer Email Testing
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {/* Inbox link */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isInboxActive
              ? "bg-zinc-900 text-white font-semibold"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Mail className="w-[18px] h-[18px]" />
          <span className="flex-1">Inbox</span>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Settings link */}
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith("/dashboard/settings")
              ? "bg-zinc-900 text-white font-semibold"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Settings className="w-[18px] h-[18px]" />
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  );
}
