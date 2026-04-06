import { Mail, Copy, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { copyToClipboard } from "../lib/utils";

export function Welcome() {
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
    <div className="text-center py-16 px-8">
      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Welcome to MailFail</h3>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 max-w-md mx-auto">
        Configure your app to send emails through the local SMTP server. Inboxes are created automatically based on the recipient address.
      </p>

      {/* SMTP Credentials */}
      <div className="bg-zinc-950 rounded-xl p-5 max-w-md mx-auto text-left relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800"
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

      <div className="mt-8 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 max-w-lg mx-auto text-left">
        <h4 className="font-semibold text-sm mb-4 text-zinc-900 dark:text-zinc-100">Quick Start</h4>
        <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md flex items-center justify-center text-xs font-bold">1</span>
            <span>Copy the SMTP credentials above</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md flex items-center justify-center text-xs font-bold">2</span>
            <span>Paste into your project's .env file</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md flex items-center justify-center text-xs font-bold">3</span>
            <span>Send a test email — an inbox will be created automatically</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
