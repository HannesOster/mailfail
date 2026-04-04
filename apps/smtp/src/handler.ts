import { simpleParser } from "mailparser";
import type { Readable } from "stream";
import type { SMTPServerSession } from "smtp-server";
import { Redis } from "@upstash/redis";
import type { Database } from "@mailfail/db";
import { users } from "@mailfail/db";
import { eq } from "drizzle-orm";
import { PLAN_LIMITS } from "@mailfail/shared";
import type { SseEvent } from "@mailfail/shared";

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
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, inbox.userId))
    .limit(1);

  if (user && !user.isOwner) {
    if (inbox.monthlyMailCount >= PLAN_LIMITS.free.maxMailsPerMonth) {
      throw new Error("Monthly email limit reached");
    }
  }

  const rawBuffer = await streamToBuffer(stream);
  const rawSource = rawBuffer.toString("utf-8");
  const parsed = await simpleParser(rawBuffer);

  const { insertEmail } = await import("@mailfail/db/src/queries/emails");
  const { incrementMailCount } = await import("@mailfail/db/src/queries/inboxes");

  const email = await insertEmail(db, {
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

  await incrementMailCount(db, inbox.id);

  // Publish SSE event via Redis
  const redis = new Redis({ url: redisUrl, token: redisToken });
  const event: SseEvent = {
    type: "new-email",
    emailId: email.id,
    inboxId: inbox.id,
  };
  await redis.publish(`inbox:${inbox.id}`, JSON.stringify(event));
}
