export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateApiKey } from "@mailfail/db/src/queries/users";

export async function POST() {
  const { user } = await requireAuth();
  const updated = await generateApiKey(db, user.id);
  return NextResponse.json({ apiKey: updated?.apiKey });
}
