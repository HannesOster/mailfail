export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { setReadStatus } from "@mailfail/db/src/queries/emails";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ mailId: string }> },
) {
  const { inbox } = await requireAuth();
  const { mailId } = await params;
  const { isRead } = await request.json();

  await setReadStatus(db, mailId, inbox.id, isRead);

  return NextResponse.json({ ok: true });
}
