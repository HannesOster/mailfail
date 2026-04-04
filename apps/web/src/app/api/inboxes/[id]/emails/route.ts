import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { listEmails, deleteAllEmails } from "@mailfail/db/src/queries/emails";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const emails = await listEmails(db, id, { limit, offset });
  return NextResponse.json(emails);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  await deleteAllEmails(db, id);
  return NextResponse.json({ ok: true });
}
