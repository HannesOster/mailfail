import { Hono } from "hono";
import type { SqliteDatabase } from "@mailfail/db/src/sqlite";
import * as inboxQueries from "@mailfail/db/src/queries/sqlite-inboxes";
import * as emailQueries from "@mailfail/db/src/queries/sqlite-emails";
import * as validationQueries from "@mailfail/db/src/queries/sqlite-validation";
import { runValidation } from "@mailfail/validation";

export function emailRoutes(db: SqliteDatabase) {
  const app = new Hono();

  // GET /api/inboxes/:id/emails
  app.get("/", (c) => {
    const inboxId = c.req.param("id")!;
    const inbox = inboxQueries.getInbox(db, inboxId);
    if (!inbox) return c.json({ error: "Inbox not found" }, 404);

    const limit = parseInt(c.req.query("limit") ?? "50", 10);
    const offset = parseInt(c.req.query("offset") ?? "0", 10);
    const emails = emailQueries.listEmails(db, inboxId, { limit, offset });
    return c.json(emails);
  });

  // DELETE /api/inboxes/:id/emails (clear all)
  app.delete("/", (c) => {
    const inboxId = c.req.param("id")!;
    emailQueries.deleteAllEmails(db, inboxId);
    return c.json({ ok: true });
  });

  // GET /api/inboxes/:id/emails/:mailId
  app.get("/:mailId", (c) => {
    const inboxId = c.req.param("id")!;
    const mailId = c.req.param("mailId");

    const email = emailQueries.getEmail(db, mailId, inboxId);
    if (!email) return c.json({ error: "Email not found" }, 404);

    emailQueries.markAsRead(db, mailId);
    const validation = validationQueries.getValidationForEmail(db, mailId);

    return c.json({ ...email, validation });
  });

  // DELETE /api/inboxes/:id/emails/:mailId
  app.delete("/:mailId", (c) => {
    const inboxId = c.req.param("id")!;
    const mailId = c.req.param("mailId");
    emailQueries.deleteEmail(db, mailId, inboxId);
    return c.json({ ok: true });
  });

  // POST /api/inboxes/:id/emails/:mailId/recheck
  app.post("/:mailId/recheck", async (c) => {
    const inboxId = c.req.param("id")!;
    const mailId = c.req.param("mailId");

    const email = emailQueries.getEmail(db, mailId, inboxId);
    if (!email) return c.json({ error: "Email not found" }, 404);

    const html = email.htmlBody ?? email.textBody ?? "";
    const result = await runValidation(html, {
      subject: email.subject,
      hasPlainText: !!email.textBody,
    });

    const saved = validationQueries.upsertValidationResult(db, {
      emailId: mailId,
      ...result,
    });

    return c.json(saved);
  });

  return app;
}
