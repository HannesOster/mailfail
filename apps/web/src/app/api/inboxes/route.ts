export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { listInboxes, createInbox } from "@mailfail/db/src/queries/inboxes";
import { checkInboxLimit } from "@/lib/limits";

export async function GET() {
  const { user } = await requireAuth();
  const inboxes = await listInboxes(db, user.id);
  return NextResponse.json(inboxes);
}

export async function POST(request: Request) {
  const { user, clerkUserId } = await requireAuth();

  const limit = await checkInboxLimit(clerkUserId, user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const inbox = await createInbox(db, user.id, name);
  return NextResponse.json(inbox, { status: 201 });
}
