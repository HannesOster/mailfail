import { Link, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";

export function SidebarNav() {
  const { pathname } = useLocation();
  const isInboxActive = pathname === "/" || pathname.startsWith("/emails");

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 bg-zinc-950 w-64 border-r border-zinc-800 z-50">
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-zinc-950 fill-zinc-950" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">MailFail</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            Local Dev Mode
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <Link
          to="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isInboxActive
              ? "bg-zinc-900 text-white font-semibold"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Mail className="w-[18px] h-[18px]" />
          <span>Inbox</span>
        </Link>
      </nav>
    </aside>
  );
}
