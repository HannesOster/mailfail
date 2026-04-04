export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { deleteInbox, updateInbox } from "@mailfail/db/src/queries/inboxes";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await requireAuth();
  const { id } = await params;

  await deleteInbox(db, id, user.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await requireAuth();
  const { id } = await params;
  const body = await request.json();

  const data: { name?: string; webhookUrl?: string | null } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name must be a non-empty string" }, { status: 400 });
    }
    data.name = body.name.trim();
  }

  if (body.webhookUrl !== undefined) {
    data.webhookUrl = body.webhookUrl === "" ? null : body.webhookUrl;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await updateInbox(db, id, user.id, data);
  if (!updated) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
