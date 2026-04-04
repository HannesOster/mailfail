"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, ClipboardPaste, Link as LinkIcon, Zap, MoreVertical } from "lucide-react";
import type { HtmlCheckSource } from "@mailfail/shared";

type HtmlCheck = {
  id: string;
  name: string;
  source: HtmlCheckSource;
  createdAt: Date;
};

type InputTab = "upload" | "paste" | "url";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function ScoreBadge({ score }: { score?: string | null }) {
  // We don't have score on the list — show placeholder
  if (!score) return <div className="w-8 h-8 rounded-full border-2 border-zinc-200 flex items-center justify-center text-xs text-zinc-400">—</div>;
  const num = parseInt(score, 10);
  const color =
    num >= 80
      ? "border-[#22C55E] text-[#22C55E] bg-[#22C55E]/5"
      : num >= 50
      ? "border-[#EAB308] text-[#EAB308] bg-[#EAB308]/5"
      : "border-[#EF4444] text-[#EF4444] bg-[#EF4444]/5";
  return (
    <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full border-2 font-bold text-xs ${color}`}>
      {score}
    </div>
  );
}

function SourceBadge({ source }: { source: HtmlCheckSource }) {
  const config = {
    upload: { icon: <Upload className="w-3 h-3" />, label: "Upload" },
    paste: { icon: <ClipboardPaste className="w-3 h-3" />, label: "Paste" },
    url: { icon: <LinkIcon className="w-3 h-3" />, label: "URL" },
  }[source];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-[#525252] text-[10px] font-bold uppercase tracking-tight">
      {config.icon} {config.label}
    </span>
  );
}

export function HtmlCheckClient({ initialChecks }: { initialChecks: HtmlCheck[] }) {
  const router = useRouter();
  const [checks, setChecks] = useState(initialChecks);
  const [activeInputTab, setActiveInputTab] = useState<InputTab>("upload");
  const [checkName, setCheckName] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  function handleFileChange(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string);
      setFileName(file.name);
      if (!checkName) setCheckName(file.name.replace(/\.html?$/, ""));
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkName.trim()) { setError("Check name is required"); return; }
    setError("");
    setUploading(true);

    try {
      const body: Record<string, string> = {
        name: checkName.trim(),
        source: activeInputTab as HtmlCheckSource,
      };

      if (activeInputTab === "upload") {
        if (!fileContent) { setError("Please select a file"); setUploading(false); return; }
        body.htmlContent = fileContent;
      } else if (activeInputTab === "paste") {
        if (!pasteContent.trim()) { setError("Please paste HTML content"); setUploading(false); return; }
        body.htmlContent = pasteContent;
      } else {
        if (!urlContent.trim()) { setError("Please enter a URL"); setUploading(false); return; }
        body.sourceUrl = urlContent.trim();
        body.htmlContent = "";
      }

      const res = await fetch("/api/html-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to run check");
        return;
      }

      const check = await res.json();
      router.push(`/dashboard/html-check/${check.id}`);
    } finally {
      setUploading(false);
    }
  }

  const inputTabs: { id: InputTab; label: string }[] = [
    { id: "upload", label: "Upload File" },
    { id: "paste", label: "Paste HTML" },
    { id: "url", label: "Fetch URL" },
  ];

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[#0A0A0A]">HTML Check</h1>
        <p className="text-[#525252] mt-1">
          Validate your email templates against dozens of email clients and standards.
        </p>
      </header>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden mb-12"
      >
        {/* Name input */}
        <div className="p-6 border-b border-[#E5E5E5]">
          <label className="block text-xs font-bold text-[#525252] uppercase tracking-wider mb-2 font-mono">
            Check name
          </label>
          <input
            type="text"
            value={checkName}
            onChange={(e) => setCheckName(e.target.value)}
            placeholder="e.g. Weekly Newsletter - October"
            className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:ring-1 focus:ring-black focus:border-black outline-none transition-all text-sm"
          />
        </div>

        {/* Source tabs */}
        <div className="px-6 py-2 bg-[#FAFAFA] border-b border-[#E5E5E5] flex gap-6">
          {inputTabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveInputTab(id)}
              className={`py-2 text-sm font-medium border-b-2 -mb-[2px] transition-all ${
                activeInputTab === id
                  ? "border-black text-black font-semibold"
                  : "border-transparent text-[#525252] hover:text-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeInputTab === "upload" && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-16 px-4 transition-colors cursor-pointer group ${
                dragOver
                  ? "border-black bg-zinc-50"
                  : "border-[#E5E5E5] bg-[#FAFAFA]/50 hover:bg-[#FAFAFA]"
              }`}
            >
              <div className="h-12 w-12 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-neutral-400" />
              </div>
              {fileName ? (
                <p className="text-sm font-medium text-[#0A0A0A]">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#0A0A0A]">
                    Drop .html file here or click to browse
                  </p>
                  <p className="text-xs text-[#525252] mt-1">Maximum file size 2MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }}
              />
            </div>
          )}

          {activeInputTab === "paste" && (
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your HTML email template here..."
              className="w-full h-64 px-4 py-3 border border-[#E5E5E5] rounded-xl font-mono text-xs focus:ring-1 focus:ring-black focus:border-black outline-none transition-all resize-y bg-[#FAFAFA]"
            />
          )}

          {activeInputTab === "url" && (
            <input
              type="url"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              placeholder="https://example.com/email-template.html"
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-all"
            />
          )}

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-[#0A0A0A] text-white px-8 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? "Running…" : "Run Check"}
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Previous Checks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">Previous Checks</h2>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAFAFA] text-xs font-bold text-[#525252] uppercase tracking-wider font-mono">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {checks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-sm">
                    No HTML checks yet. Run your first check above.
                  </td>
                </tr>
              ) : (
                checks.map((check) => (
                  <tr
                    key={check.id}
                    className="hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                    onClick={() => router.push(`/dashboard/html-check/${check.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#0A0A0A]">{check.name}</div>
                      <div className="text-[10px] font-mono text-[#525252]">
                        ID: {check.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <SourceBadge source={check.source} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ScoreBadge />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#525252]">
                      {timeAgo(new Date(check.createdAt))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-neutral-300 group-hover:text-black transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
