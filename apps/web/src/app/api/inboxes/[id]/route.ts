import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { deleteInbox, renameInbox } from "@mailfail/db/src/queries/inboxes";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  await deleteInbox(db, id, org.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;
  const { name } = await request.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await renameInbox(db, id, org.id, name);
  if (!updated) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
