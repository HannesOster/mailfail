export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getHtmlCheck, deleteHtmlCheck } from "@mailfail/db/src/queries/html-checks";
import { getValidationForHtmlCheck } from "@mailfail/db/src/queries/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await requireAuth();
  const { id } = await params;

  const check = await getHtmlCheck(db, id, user.id);
  if (!check) {
    return NextResponse.json({ error: "HTML check not found" }, { status: 404 });
  }

  const validation = await getValidationForHtmlCheck(db, id);

  return NextResponse.json({ ...check, validation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await requireAuth();
  const { id } = await params;

  await deleteHtmlCheck(db, id, user.id);
  return NextResponse.json({ ok: true });
}
