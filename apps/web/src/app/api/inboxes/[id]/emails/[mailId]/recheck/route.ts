export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuthFromRequest } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { getEmail } from "@mailfail/db/src/queries/emails";
import { upsertValidationResult } from "@mailfail/db/src/queries/validation";
import { runValidation } from "@mailfail/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; mailId: string }> },
) {
  const { user } = await requireAuthFromRequest(request);
  const { id, mailId } = await params;

  const inbox = await getInbox(db, id, user.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const email = await getEmail(db, mailId, id);
  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const html = email.htmlBody ?? email.textBody ?? "";
  const result = await runValidation(html, {
    subject: email.subject,
    hasPlainText: !!email.textBody,
  });

  const saved = await upsertValidationResult(db, {
    emailId: mailId,
    ...result,
  });

  return NextResponse.json(saved);
}
