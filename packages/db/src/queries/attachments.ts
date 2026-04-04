import { eq } from "drizzle-orm";
import type { Database } from "..";
import { attachments } from "../schema";

export async function insertAttachment(
  db: Database,
  data: {
    emailId: string;
    filename: string;
    mimeType: string;
    size: number;
    storagePath: string;
  },
) {
  const [attachment] = await db.insert(attachments).values(data).returning();
  return attachment;
}

export async function getAttachmentsByEmailId(db: Database, emailId: string) {
  return db.select().from(attachments).where(eq(attachments.emailId, emailId));
}
