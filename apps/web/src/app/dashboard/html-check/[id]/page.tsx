export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getHtmlCheck } from "@mailfail/db/src/queries/html-checks";
import { getValidationForHtmlCheck } from "@mailfail/db/src/queries/validation";
import { HtmlCheckDetailClient } from "./html-check-detail-client";

export default async function HtmlCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireOrg();

  const check = await getHtmlCheck(db, id, org.id);
  if (!check) notFound();

  const validation = await getValidationForHtmlCheck(db, id);

  return (
    <div className="max-w-5xl mx-auto">
      <HtmlCheckDetailClient check={check} initialValidation={validation} />
    </div>
  );
}
