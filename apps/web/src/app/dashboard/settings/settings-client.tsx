"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, RefreshCw, Key } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

export function ApiKeySection({ initialApiKey }: { initialApiKey: string | null }) {
  const [apiKey, setApiKey] = useState<string | null>(initialApiKey);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(confirmed: boolean) {
    if (confirmed && apiKey) {
      if (!confirm("Regenerate your API key? The existing key will stop working immediately.")) return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/settings/api-key", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
        setVisible(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!apiKey) return;
    copyToClipboard(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 8)}${"•".repeat(32)}${apiKey.slice(-4)}`
    : null;

  return (
    <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">API Key</h3>
        </div>

        {apiKey ? (
          <>
            <p className="text-xs text-zinc-500 mb-3">
              Use this key as a Bearer token to authenticate API requests.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-xs text-zinc-700 truncate select-all">
                {visible ? apiKey : maskedKey}
              </div>
              <button
                onClick={() => setVisible((v) => !v)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                title={visible ? "Hide key" : "Show key"}
              >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopy}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                title="Copy key"
              >
                {copied ? (
                  <span className="text-green-600 text-xs font-sans">Copied!</span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              onClick={() => handleGenerate(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Regenerate Key
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-zinc-500 mb-4">
              Generate an API key to authenticate programmatic access to your inboxes.
            </p>
            <button
              onClick={() => handleGenerate(false)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <Key className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
              {loading ? "Generating…" : "Generate API Key"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
