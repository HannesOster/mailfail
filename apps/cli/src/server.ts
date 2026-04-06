import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import type { SqliteDatabase } from "@mailfail/db/src/sqlite";
import * as inboxQueries from "@mailfail/db/src/queries/sqlite-inboxes";
import * as emailQueries from "@mailfail/db/src/queries/sqlite-emails";
import * as validationQueries from "@mailfail/db/src/queries/sqlite-validation";
import { runValidation } from "@mailfail/validation";
import { bus } from "./events.js";
import path from "path";
import { fileURLToPath } from "url";

function getDefaultInbox(db: SqliteDatabase) {
  return inboxQueries.getOrCreateInboxByRouteKey(db, "default");
}

export function createApp(db: SqliteDatabase) {
  const app = new Hono();
  app.use("*", cors());

  // GET /api/emails — list all emails
  app.get("/api/emails", (c) => {
    const inbox = getDefaultInbox(db);
    const limit = parseInt(c.req.query("limit") ?? "50", 10);
    const offset = parseInt(c.req.query("offset") ?? "0", 10);
    const emails = emailQueries.listEmails(db, inbox.id, { limit, offset });
    return c.json(emails);
  });

  // DELETE /api/emails — clear all emails
  app.delete("/api/emails", (c) => {
    const inbox = getDefaultInbox(db);
    emailQueries.deleteAllEmails(db, inbox.id);
    return c.json({ ok: true });
  });

  // GET /api/emails/:mailId — email detail with validation
  app.get("/api/emails/:mailId", (c) => {
    const inbox = getDefaultInbox(db);
    const mailId = c.req.param("mailId");
    const email = emailQueries.getEmail(db, mailId, inbox.id);
    if (!email) return c.json({ error: "Email not found" }, 404);
    emailQueries.markAsRead(db, mailId);
    const validation = validationQueries.getValidationForEmail(db, mailId);
    return c.json({ ...email, validation });
  });

  // DELETE /api/emails/:mailId — delete email
  app.delete("/api/emails/:mailId", (c) => {
    const inbox = getDefaultInbox(db);
    const mailId = c.req.param("mailId");
    emailQueries.deleteEmail(db, mailId, inbox.id);
    return c.json({ ok: true });
  });

  // POST /api/emails/:mailId/recheck — re-run validation
  app.post("/api/emails/:mailId/recheck", async (c) => {
    const inbox = getDefaultInbox(db);
    const mailId = c.req.param("mailId");
    const email = emailQueries.getEmail(db, mailId, inbox.id);
    if (!email) return c.json({ error: "Email not found" }, 404);

    const html = email.htmlBody ?? email.textBody ?? "";
    const result = await runValidation(html, {
      subject: email.subject,
      hasPlainText: !!email.textBody,
    });
    const saved = validationQueries.upsertValidationResult(db, { emailId: mailId, ...result });
    return c.json(saved);
  });

  // POST /api/emails/:mailId/forward — forward email
  app.post("/api/emails/:mailId/forward", async (c) => {
    const inbox = getDefaultInbox(db);
    const mailId = c.req.param("mailId");
    const email = emailQueries.getEmail(db, mailId, inbox.id);
    if (!email) return c.json({ error: "Email not found" }, 404);

    const { to } = await c.req.json();
    if (!to || typeof to !== "string") {
      return c.json({ error: "Destination email required" }, 400);
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return c.json({ error: "Email forwarding not configured. Set RESEND_API_KEY." }, 404);
    }

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "MailFail <forwarded@mailfail.dev>",
      to: [to],
      subject: `[Forwarded] ${email.subject}`,
      html: email.htmlBody || email.textBody || "No content",
    });
    return c.json({ ok: true });
  });

  // GET /api/stream — SSE for new emails
  app.get("/api/stream", (c) => {
    const encoder = new TextEncoder();
    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const unsubscribe = bus.onSseEvent((event) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            unsubscribe();
          }
        });

        const keepalive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            clearInterval(keepalive);
            unsubscribe();
          }
        }, 30_000);

        cleanup = () => {
          clearInterval(keepalive);
          unsubscribe();
        };
      },
      cancel() {
        cleanup?.();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  // Static files for SPA
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const uiDir = path.join(__dirname, "ui");
  app.use("/*", serveStatic({ root: uiDir }));
  app.get("*", serveStatic({ root: uiDir, path: "index.html" }));

  return app;
}
