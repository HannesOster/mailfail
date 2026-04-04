export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { emails } from "@mailfail/db";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  const { inbox } = await requireAuth();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(and(eq(emails.inboxId, inbox.id), eq(emails.isRead, false)));
  return NextResponse.json({ count: Number(result.count) });
}
