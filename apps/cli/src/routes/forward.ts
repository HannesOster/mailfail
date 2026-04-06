import { Hono } from "hono";
import type { SqliteDatabase } from "@mailfail/db/src/sqlite";
import * as emailQueries from "@mailfail/db/src/queries/sqlite-emails";

export function forwardRoutes(db: SqliteDatabase) {
  const app = new Hono();

  // POST /api/inboxes/:id/emails/:mailId/forward
  app.post("/:mailId/forward", async (c) => {
    const inboxId = c.req.param("id")!;
    const mailId = c.req.param("mailId");

    const email = emailQueries.getEmail(db, mailId, inboxId);
    if (!email) return c.json({ error: "Email not found" }, 404);

    const { to } = await c.req.json();
    if (!to || typeof to !== "string") {
      return c.json({ error: "Destination email required" }, 400);
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return c.json(
        { error: "Email forwarding not configured. Set RESEND_API_KEY." },
        404,
      );
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

  return app;
}
