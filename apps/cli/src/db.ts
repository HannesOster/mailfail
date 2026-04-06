import { createSqliteDb } from "@mailfail/db/src/sqlite";
import path from "path";
import fs from "fs";

export function initDatabase(dataDir: string) {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "data.db");
  const db = createSqliteDb(dbPath);

  // Run migrations using the underlying better-sqlite3 client
  const client = (db as any).$client;
  client.exec(`
    CREATE TABLE IF NOT EXISTS inboxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      route_key TEXT NOT NULL UNIQUE,
      webhook_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      inbox_id TEXT NOT NULL REFERENCES inboxes(id) ON DELETE CASCADE,
      "from" TEXT NOT NULL,
      "to" TEXT NOT NULL DEFAULT '[]',
      cc TEXT NOT NULL DEFAULT '[]',
      bcc TEXT NOT NULL DEFAULT '[]',
      subject TEXT NOT NULL DEFAULT '(no subject)',
      html_body TEXT,
      text_body TEXT,
      raw_source TEXT NOT NULL,
      headers TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      received_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      email_id TEXT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      storage_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS validation_results (
      id TEXT PRIMARY KEY,
      email_id TEXT REFERENCES emails(id) ON DELETE CASCADE,
      overall_score TEXT NOT NULL,
      link_checks TEXT NOT NULL DEFAULT '[]',
      image_checks TEXT NOT NULL DEFAULT '[]',
      spam_score TEXT NOT NULL,
      html_issues TEXT NOT NULL DEFAULT '[]',
      compat_issues TEXT NOT NULL DEFAULT '[]',
      a11y_issues TEXT NOT NULL DEFAULT '[]',
      checked_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_emails_inbox_id ON emails(inbox_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);
    CREATE INDEX IF NOT EXISTS idx_validation_results_email_id ON validation_results(email_id);
  `);

  return db;
}
