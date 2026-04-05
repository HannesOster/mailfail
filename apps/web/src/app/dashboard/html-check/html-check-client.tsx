"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, ClipboardPaste, Link as LinkIcon, Zap, MoreVertical } from "lucide-react";
import type { HtmlCheckSource } from "@mailfail/shared";
import { timeAgo } from "@/lib/utils";

type HtmlCheck = {
  id: string;
  name: string;
  source: HtmlCheckSource;
  createdAt: Date;
};

type InputTab = "upload" | "paste" | "url";

function ScoreBadge({ score }: { score?: string | null }) {
  if (!score) return <div className="w-8 h-8 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">—</div>;
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-tight">
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
        <h1 className="text-3xl font-black tracking-tight text-[#0A0A0A] dark:text-zinc-100">HTML Check</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Validate your email templates against dozens of email clients and standards.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-12"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 font-mono">
            Check name
          </label>
          <input
            type="text"
            value={checkName}
            onChange={(e) => setCheckName(e.target.value)}
            placeholder="e.g. Weekly Newsletter - October"
            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-black dark:focus:ring-zinc-400 focus:border-black dark:focus:border-zinc-400 outline-none transition-all text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>

        <div className="px-6 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex gap-6">
          {inputTabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveInputTab(id)}
              className={`py-2 text-sm font-medium border-b-2 -mb-[2px] transition-all ${
                activeInputTab === id
                  ? "border-black dark:border-zinc-100 text-black dark:text-zinc-100 font-semibold"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100"
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
                  ? "border-black dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-neutral-400 dark:text-zinc-500" />
              </div>
              {fileName ? (
                <p className="text-sm font-medium text-[#0A0A0A] dark:text-zinc-100">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#0A0A0A] dark:text-zinc-100">
                    Drop .html file here or click to browse
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Maximum file size 2MB</p>
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
              className="w-full h-64 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs focus:ring-1 focus:ring-black dark:focus:ring-zinc-400 focus:border-black dark:focus:border-zinc-400 outline-none transition-all resize-y bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          )}

          {activeInputTab === "url" && (
            <input
              type="url"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              placeholder="https://example.com/email-template.html"
              className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-1 focus:ring-black dark:focus:ring-zinc-400 focus:border-black dark:focus:border-zinc-400 outline-none transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          )}

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-[#0A0A0A] dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? "Running…" : "Run Check"}
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight dark:text-zinc-100">Previous Checks</h2>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-mono">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {checks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                    No HTML checks yet. Run your first check above.
                  </td>
                </tr>
              ) : (
                checks.map((check) => (
                  <tr
                    key={check.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/dashboard/html-check/${check.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#0A0A0A] dark:text-zinc-100">{check.name}</div>
                      <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                        ID: {check.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <SourceBadge source={check.source} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ScoreBadge />
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {timeAgo(new Date(check.createdAt))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-neutral-300 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-zinc-100 transition-colors">
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
