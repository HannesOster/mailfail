import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { listInboxes, createInbox } from "@mailfail/db/src/queries/inboxes";
import { checkInboxLimit } from "@/lib/limits";

export async function GET() {
  const { org } = await requireOrg();
  const inboxes = await listInboxes(db, org.id);
  return NextResponse.json(inboxes);
}

export async function POST(request: Request) {
  const { org, orgId } = await requireOrg();

  const limit = await checkInboxLimit(orgId, org.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const inbox = await createInbox(db, org.id, name);
  return NextResponse.json(inbox, { status: 201 });
}
