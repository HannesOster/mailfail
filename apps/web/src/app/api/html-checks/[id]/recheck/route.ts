import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getHtmlCheck } from "@mailfail/db/src/queries/html-checks";
import { upsertValidationResult } from "@mailfail/db/src/queries/validation";
import { runValidation } from "@/lib/validation/pipeline";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const check = await getHtmlCheck(db, id, org.id);
  if (!check) {
    return NextResponse.json({ error: "HTML check not found" }, { status: 404 });
  }

  const result = await runValidation(check.htmlContent);
  const saved = await upsertValidationResult(db, { htmlCheckId: id, ...result });

  return NextResponse.json(saved);
}
