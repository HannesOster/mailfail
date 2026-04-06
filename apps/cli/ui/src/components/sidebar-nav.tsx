import { Link, useLocation } from "react-router-dom";
import { Inbox, Mail, Copy, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { copyToClipboard } from "../lib/utils";

function SmtpCredentials() {
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
    <div className="mt-auto px-4 pt-6">
      <div className="bg-zinc-900/50 rounded-xl p-4 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-500 font-label">
            SMTP Credentials
          </h3>
          <button
            onClick={handleCopy}
            className="text-zinc-600 hover:text-zinc-300 transition-colors"
            title={copied ? "Copied!" : "Copy all"}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="space-y-3 font-mono text-sm">
          <div>
            <label className="block text-[10px] text-zinc-600 mb-1">HOST</label>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded px-3 py-1.5 text-zinc-300">
              localhost
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-600 mb-1">PORT</label>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded px-3 py-1.5 text-zinc-300">
              2525
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-600 mb-1">USER</label>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded px-3 py-1.5 text-zinc-400">
                dev
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-600 mb-1">PASS</label>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded px-3 py-1.5 text-zinc-400">
                dev
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarNav() {
  const { pathname } = useLocation();
  const isInboxActive = pathname === "/" || pathname.startsWith("/emails");

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0e0e10] flex flex-col py-8 px-4 z-50 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-900 shadow-inner">
          <Mail className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tighter text-zinc-100 leading-none">
            MailFail
          </span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1 font-label">
            Local Dev Mode
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        <Link
          to="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg group transition-all duration-200 ${
            isInboxActive
              ? "text-zinc-50 bg-zinc-800/50 font-semibold"
              : "text-zinc-500 font-medium hover:bg-zinc-800 hover:text-zinc-100"
          }`}
        >
          <Inbox className="w-5 h-5" />
          <span className="font-label">Inbox</span>
        </Link>
      </nav>

      {/* SMTP Credentials */}
      <SmtpCredentials />
    </aside>
  );
}
