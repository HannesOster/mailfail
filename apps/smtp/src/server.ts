import { SMTPServer } from "smtp-server";
import type { Database } from "@mailfail/db";
import { SMTP_CONFIG } from "@mailfail/shared";
import { handleMessage } from "./handler";

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
      handleMessage(stream, session, db, redisUrl, redisToken)
        .then(() => callback())
        .catch((err) => callback(new Error(err.message)));
    },
  });

  return server;
}
