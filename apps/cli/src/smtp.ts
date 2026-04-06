import { SMTPServer } from "smtp-server";
import { parseEmailStream } from "@mailfail/smtp";
import { SMTP_CONFIG } from "@mailfail/shared";
import { bus } from "./events.js";
import type { SqliteDatabase } from "@mailfail/db/src/sqlite";
import type { Storage } from "./storage.js";
import * as inboxQueries from "@mailfail/db/src/queries/sqlite-inboxes";
import * as emailQueries from "@mailfail/db/src/queries/sqlite-emails";
import * as attachmentQueries from "@mailfail/db/src/queries/sqlite-attachments";
import * as validationQueries from "@mailfail/db/src/queries/sqlite-validation";
import { runValidation } from "@mailfail/validation";
import type { Readable } from "stream";

function extractRouteKey(toAddresses: string[]): string {
  if (toAddresses.length === 0) return "catchall";
  const first = toAddresses[0];
  // Extract local-part from "Name <email@domain>" or "email@domain"
  const match = first.match(/<([^>]+)>/) || [null, first];
  const email = match[1] || first;
  const localPart = email.split("@")[0]?.toLowerCase().trim();
  return localPart || "catchall";
}

export function createLocalSmtpServer(db: SqliteDatabase, storage: Storage) {
  const server = new SMTPServer({
    authOptional: false,
    size: SMTP_CONFIG.maxMessageSizeBytes,
    disabledCommands: ["STARTTLS"],

    onAuth(auth, _session, callback) {
      if (auth.username === "dev" && auth.password === "dev") {
        callback(null, { user: "dev" });
      } else {
        callback(new Error("Invalid credentials. Use dev/dev."));
      }
    },

    onData(stream, _session, callback) {
      handleLocalMessage(stream as Readable, db, storage)
        .then(() => callback())
        .catch((err: Error) => callback(new Error(err.message)));
    },
  });

  server.on("error", (err: Error) => {
    console.error("SMTP server error:", err.message);
  });

  return server;
}

async function handleLocalMessage(
  stream: Readable,
  db: SqliteDatabase,
  storage: Storage,
) {
  const parsed = await parseEmailStream(stream);

  const routeKey = extractRouteKey(parsed.to);
  const inbox = inboxQueries.getOrCreateInboxByRouteKey(db, routeKey);

  const email = emailQueries.insertEmail(db, {
    inboxId: inbox.id,
    from: parsed.from,
    to: parsed.to,
    cc: parsed.cc,
    bcc: parsed.bcc,
    subject: parsed.subject,
    htmlBody: parsed.htmlBody,
    textBody: parsed.textBody,
    rawSource: parsed.rawSource,
    headers: parsed.headers,
  });

  // Emit SSE event
  bus.emitSseEvent({
    type: "new-email",
    emailId: email.id,
    inboxId: inbox.id,
  });

  // Store attachments
  if (parsed.attachments.length > 0) {
    for (const att of parsed.attachments) {
      const filePath = await storage.save(email.id, att.filename, att.content);
      attachmentQueries.insertAttachment(db, {
        emailId: email.id,
        filename: att.filename,
        mimeType: att.contentType,
        size: att.size,
        storagePath: filePath,
      });
    }
  }

  // Run validation async
  const htmlContent = parsed.htmlBody || parsed.textBody || "";
  if (htmlContent) {
    runValidation(htmlContent, {
      subject: parsed.subject,
      hasPlainText: !!parsed.textBody,
    })
      .then((result) => {
        validationQueries.upsertValidationResult(db, {
          emailId: email.id,
          ...result,
        });
        bus.emitSseEvent({
          type: "validation-complete",
          emailId: email.id,
          inboxId: inbox.id,
        });
      })
      .catch((err: Error) => {
        console.error("Validation failed:", err.message);
      });
  }
}
