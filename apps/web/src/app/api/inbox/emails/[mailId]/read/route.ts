export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { emails } from "@mailfail/db/src/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ mailId: string }> },
) {
  const { inbox } = await requireAuth();
  const { mailId } = await params;
  const { isRead } = await request.json();

  await db
    .update(emails)
    .set({ isRead })
    .where(and(eq(emails.id, mailId), eq(emails.inboxId, inbox.id)));

  return NextResponse.json({ ok: true });
}
