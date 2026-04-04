"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, FileCode, Settings, Mail } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inboxes", label: "Inboxes", icon: Inbox },
  { href: "/dashboard/html-check", label: "HTML Check", icon: FileCode },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

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
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
