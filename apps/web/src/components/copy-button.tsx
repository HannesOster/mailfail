"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-zinc-500 hover:text-white transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <span className="material-symbols-outlined text-green-400">
          check
        </span>
      ) : (
        <span className="material-symbols-outlined">content_copy</span>
      )}
    </button>
  );
}
