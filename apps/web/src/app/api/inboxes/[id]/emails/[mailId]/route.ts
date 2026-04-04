import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { getEmail, deleteEmail, markAsRead } from "@mailfail/db/src/queries/emails";
import { getValidationForEmail } from "@mailfail/db/src/queries/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; mailId: string }> },
) {
  const { org } = await requireOrg();
  const { id, mailId } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const email = await getEmail(db, mailId, id);
  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  await markAsRead(db, mailId);

  const validation = await getValidationForEmail(db, mailId);

  return NextResponse.json({ ...email, validation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mailId: string }> },
) {
  const { org } = await requireOrg();
  const { id, mailId } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  await deleteEmail(db, mailId, id);
  return NextResponse.json({ ok: true });
}
