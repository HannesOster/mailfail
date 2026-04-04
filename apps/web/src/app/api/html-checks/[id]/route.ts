import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getHtmlCheck, deleteHtmlCheck } from "@mailfail/db/src/queries/html-checks";
import { getValidationForHtmlCheck } from "@mailfail/db/src/queries/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const check = await getHtmlCheck(db, id, org.id);
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
  const { org } = await requireOrg();
  const { id } = await params;

  await deleteHtmlCheck(db, id, org.id);
  return NextResponse.json({ ok: true });
}
