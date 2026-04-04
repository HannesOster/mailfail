export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getHtmlCheck } from "@mailfail/db/src/queries/html-checks";
import { getValidationForHtmlCheck } from "@mailfail/db/src/queries/validation";
import { HtmlCheckDetailClient } from "./html-check-detail-client";

export default async function HtmlCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireAuth();

  const check = await getHtmlCheck(db, id, user.id);
  if (!check) notFound();

  const validation = await getValidationForHtmlCheck(db, id);

  return (
    <div className="max-w-5xl mx-auto">
      <HtmlCheckDetailClient check={check} initialValidation={validation} />
    </div>
  );
}
