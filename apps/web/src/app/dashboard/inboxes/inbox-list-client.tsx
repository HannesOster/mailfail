"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Copy, Eye, EyeOff, Inbox, Webhook, Check } from "lucide-react";
import { timeAgo, copyToClipboard } from "@/lib/utils";

type InboxData = {
  id: string;
  name: string;
  smtpUser: string;
  smtpPass: string;
  monthlyMailCount: number;
  createdAt: Date;
  webhookUrl?: string | null;
};

function InboxCard({
  inbox,
  smtpHost,
  onDelete,
  onUpdate,
}: {
  inbox: InboxData;
  smtpHost: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<InboxData>) => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(inbox.webhookUrl ?? "");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const webhookTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (webhookTimerRef.current) clearTimeout(webhookTimerRef.current);
  }, []);

  async function handleDelete() {
    if (!confirm(`Delete inbox "${inbox.name}"? All emails will be lost.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/inboxes/${inbox.id}`, { method: "DELETE" });
      if (res.ok) onDelete(inbox.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      const res = await fetch(`/api/inboxes/${inbox.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(inbox.id, { webhookUrl: updated.webhookUrl });
        setWebhookSaved(true);
        if (webhookTimerRef.current) clearTimeout(webhookTimerRef.current);
        webhookTimerRef.current = setTimeout(() => setWebhookSaved(false), 2000);
      }
    } finally {
      setSavingWebhook(false);
    }
  }

  const copyEnv = `SMTP_HOST=${smtpHost}\nSMTP_PORT=2525\nSMTP_USER=${inbox.smtpUser}\nSMTP_PASS=${inbox.smtpPass}`;
  const envBlock = showPass ? copyEnv : copyEnv.replace(inbox.smtpPass, "•".repeat(24));

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:border-neutral-300 dark:hover:border-zinc-700 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
            <Inbox className="w-5 h-5 text-neutral-400 dark:text-zinc-500" />
          </div>
          <Link
            href={`/dashboard/inboxes/${inbox.id}`}
            className="font-bold text-lg text-neutral-900 dark:text-zinc-100 hover:underline"
          >
            {inbox.name}
          </Link>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-neutral-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="relative bg-neutral-900 dark:bg-zinc-950 rounded-lg p-5 mb-5 font-mono text-sm text-neutral-300">
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={() => setShowPass((v) => !v)}
            className="text-neutral-500 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-100 transition-colors p-1"
            title={showPass ? "Hide password" : "Show password"}
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              copyToClipboard(copyEnv);
              setCopied(true);
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => setCopied(false), 2000);
            }}
            className="text-neutral-500 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-100 transition-colors p-1"
            title="Copy all as .env"
          >
            {copied ? (
              <span className="text-green-400 text-xs font-sans">Copied!</span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <pre className="whitespace-pre leading-relaxed">{envBlock}</pre>
      </div>

      {/* Webhook Settings */}
      <form onSubmit={handleSaveWebhook} className="mb-5">
        <label className="block text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Webhook className="w-3.5 h-3.5" />
          Webhook URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-neutral-900 dark:focus:ring-zinc-400 focus:border-neutral-900 dark:focus:border-zinc-400 outline-none transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={savingWebhook}
            className="px-3 py-1.5 text-sm font-medium bg-neutral-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {webhookSaved ? (
              <><Check className="w-3.5 h-3.5 text-green-400 dark:text-green-600" /> Saved</>
            ) : savingWebhook ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-zinc-800">
        <div className="text-sm text-neutral-500 dark:text-zinc-400">
          {inbox.monthlyMailCount} emails this month · Created {timeAgo(inbox.createdAt)}
        </div>
        <Link
          href={`/dashboard/inboxes/${inbox.id}`}
          className="text-xs font-medium text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-100 transition-colors"
        >
          View emails →
        </Link>
      </div>
    </div>
  );
}

export function InboxListClient({
  initialInboxes,
  smtpHost,
}: {
  initialInboxes: InboxData[];
  smtpHost: string;
}) {
  const router = useRouter();
  const [inboxes, setInboxes] = useState(initialInboxes);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  function handleDelete(id: string) {
    setInboxes((prev) => prev.filter((i) => i.id !== id));
  }

  function handleUpdate(id: string, data: Partial<InboxData>) {
    setInboxes((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create inbox");
        return;
      }
      const inbox = await res.json();
      setInboxes((prev) => [...prev, inbox]);
      setNewName("");
      setShowForm(false);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-100">Inboxes</h2>
          <p className="text-neutral-500 dark:text-zinc-400 mt-1">Manage and monitor your virtual SMTP endpoints.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-neutral-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Inbox
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-end gap-4"
        >
          <div className="flex-1">
            <label className="block text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Inbox name
            </label>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Staging Environment"
              className="w-full px-4 py-2 border border-neutral-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-neutral-900 dark:focus:ring-zinc-400 focus:border-neutral-900 dark:focus:border-zinc-400 outline-none transition-all text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); setNewName(""); }}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-neutral-200 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {inboxes.length === 0 ? (
          <div className="text-center py-16 text-neutral-400 dark:text-zinc-500">
            <Inbox className="w-12 h-12 mx-auto mb-4 text-neutral-200 dark:text-zinc-700" />
            <p className="font-medium text-neutral-500 dark:text-zinc-400">No inboxes yet</p>
            <p className="text-sm mt-1 dark:text-zinc-500">Create your first inbox to start catching test emails.</p>
          </div>
        ) : (
          inboxes.map((inbox) => (
            <InboxCard
              key={inbox.id}
              inbox={inbox}
              smtpHost={smtpHost}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>
    </>
  );
}
