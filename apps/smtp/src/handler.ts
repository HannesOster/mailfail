import { simpleParser } from "mailparser";
import type { Readable } from "stream";
import type { SMTPServerSession } from "smtp-server";
import { Redis } from "@upstash/redis";
import type { Database } from "@mailfail/db";
import { users } from "@mailfail/db";
import { eq } from "drizzle-orm";
import { PLAN_LIMITS } from "@mailfail/shared";
import type { SseEvent } from "@mailfail/shared";
import { runValidation } from "@mailfail/validation";
import { put } from "@vercel/blob";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function handleMessage(
  stream: Readable,
  session: SMTPServerSession,
  db: Database,
  redisUrl: string,
  redisToken: string,
) {
  const inbox = (session as any).inbox;
  if (!inbox) throw new Error("No inbox in session");

  // Check monthly limit
  let user: typeof users.$inferSelect | undefined;
  try {
    const [found] = await db
      .select()
      .from(users)
      .where(eq(users.id, inbox.userId))
      .limit(1);
    user = found;
  } catch (err) {
    console.error("Failed to query user for inbox", inbox.id, err);
    throw new Error("Database error while checking limits");
  }

  if (user && !user.isOwner) {
    if (inbox.monthlyMailCount >= PLAN_LIMITS.free.maxMailsPerMonth) {
      throw new Error("Monthly email limit reached");
    }
  }

  const rawBuffer = await streamToBuffer(stream);
  const rawSource = rawBuffer.toString("utf-8");

  let parsed: Awaited<ReturnType<typeof simpleParser>>;
  try {
    parsed = await simpleParser(rawBuffer);
  } catch (err) {
    console.error("Failed to parse email", err);
    throw new Error("Failed to parse email message");
  }

  const { insertEmail } = await import("@mailfail/db/src/queries/emails");
  const { incrementMailCount } = await import("@mailfail/db/src/queries/inboxes");

  let email: Awaited<ReturnType<typeof insertEmail>>;
  try {
    email = await insertEmail(db, {
      inboxId: inbox.id,
      from: parsed.from?.text ?? "unknown",
      to: parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map((a) => a.text) : [parsed.to.text]) : [],
      cc: parsed.cc ? (Array.isArray(parsed.cc) ? parsed.cc.map((a) => a.text) : [parsed.cc.text]) : [],
      bcc: parsed.bcc ? (Array.isArray(parsed.bcc) ? parsed.bcc.map((a) => a.text) : [parsed.bcc.text]) : [],
      subject: parsed.subject ?? "(no subject)",
      htmlBody: parsed.html || null,
      textBody: parsed.text || null,
      rawSource,
      headers: Object.fromEntries(parsed.headers) as Record<string, string>,
    });
  } catch (err) {
    console.error("Failed to insert email into database", err);
    throw new Error("Database error while storing email");
  }

  try {
    await incrementMailCount(db, inbox.id);
  } catch (err) {
    console.error("Failed to increment mail count for inbox", inbox.id, err);
    // Non-fatal — email is already stored
  }

  // Publish SSE event via Redis
  const redis = new Redis({ url: redisUrl, token: redisToken });
  try {
    const event: SseEvent = {
      type: "new-email",
      emailId: email.id,
      inboxId: inbox.id,
    };
    await redis.publish(`inbox:${inbox.id}`, JSON.stringify(event));
  } catch (err) {
    console.error("Failed to publish SSE event for email", email.id, err);
    // Non-fatal
  }

  // Send webhook notification if configured
  if (inbox.webhookUrl) {
    fetch(inbox.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "new-email",
        emailId: email.id,
        inboxId: inbox.id,
        from: email.from,
        subject: email.subject,
        receivedAt: new Date().toISOString(),
      }),
    }).catch((err: Error) => {
      console.error("Webhook delivery failed:", err.message);
    });
  }

  // Process attachments (fire and don't block SMTP response)
  if (parsed.attachments && parsed.attachments.length > 0) {
    const { insertAttachment } = await import("@mailfail/db/src/queries/attachments");

    for (const att of parsed.attachments) {
      try {
        const blob = await put(
          `attachments/${email.id}/${att.filename || "unnamed"}`,
          att.content,
          { access: "public", contentType: att.contentType },
        );

        await insertAttachment(db, {
          emailId: email.id,
          filename: att.filename || "unnamed",
          mimeType: att.contentType || "application/octet-stream",
          size: att.size,
          storagePath: blob.url,
        });
      } catch (err) {
        console.error("Failed to store attachment:", err);
      }
    }
  }

  // Run validation asynchronously — don't block the SMTP response
  const htmlContent = parsed.html || parsed.text || "";
  if (htmlContent) {
    const { upsertValidationResult } = await import("@mailfail/db/src/queries/validation");

    runValidation(htmlContent, {
      subject: parsed.subject,
      hasPlainText: !!parsed.text,
    })
      .then(async (result) => {
        try {
          await upsertValidationResult(db, { emailId: email.id, ...result });
          const valEvent = {
            type: "validation-complete",
            emailId: email.id,
            inboxId: inbox.id,
          };
          await redis.publish(`inbox:${inbox.id}`, JSON.stringify(valEvent));
        } catch (err) {
          console.error("Failed to store validation result for email", email.id, err);
        }
      })
      .catch((err) => {
        console.error("Validation failed for email", email.id, err);
      });
  }
}
