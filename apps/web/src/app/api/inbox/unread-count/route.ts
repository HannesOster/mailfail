export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { listEmails } from "@mailfail/db/src/queries/emails";

export async function GET() {
  const { inbox } = await requireAuth();
  const emails = await listEmails(db, inbox.id, { limit: 1000 });
  const count = emails.filter((e) => !e.isRead).length;
  return NextResponse.json({ count });
}
