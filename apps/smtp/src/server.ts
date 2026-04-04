import { SMTPServer } from "smtp-server";
import type { Database } from "@mailfail/db";
import { SMTP_CONFIG } from "@mailfail/shared";
import { handleMessage } from "./handler";

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(inboxId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(inboxId);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(inboxId, { count: 1, resetAt: now + 1000 });
    return true;
  }

  if (limit.count >= SMTP_CONFIG.maxRatePerSecond) {
    return false;
  }

  limit.count++;
  return true;
}

export function createSmtpServer(db: Database, redisUrl: string, redisToken: string) {
  const server = new SMTPServer({
    authOptional: false,
    size: SMTP_CONFIG.maxMessageSizeBytes,
    disabledCommands: ["STARTTLS"],

    async onAuth(auth, session, callback) {
      try {
        // Import dynamically to avoid circular issues
        const { authenticateSmtp } = await import("@mailfail/db/src/queries/inboxes");
        const inbox = await authenticateSmtp(db, auth.username ?? "", auth.password ?? "");
        if (!inbox) {
          return callback(new Error("Invalid credentials"));
        }
        (session as any).inbox = inbox;
        callback(null, { user: inbox.id });
      } catch (err) {
        callback(new Error("Authentication failed"));
      }
    },

    onData(stream, session, callback) {
      const inbox = (session as any).inbox;
      if (inbox && !checkRateLimit(inbox.id)) {
        return callback(new Error("Rate limit exceeded. Try again later."));
      }
      handleMessage(stream, session, db, redisUrl, redisToken)
        .then(() => callback())
        .catch((err) => callback(new Error(err.message)));
    },
  });

  return server;
}
