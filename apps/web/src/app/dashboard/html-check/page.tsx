export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { listHtmlChecks } from "@mailfail/db/src/queries/html-checks";
import { HtmlCheckClient } from "./html-check-client";

export default async function HtmlCheckPage() {
  const { org } = await requireOrg();
  const checks = await listHtmlChecks(db, org.id);

  return (
    <div className="max-w-5xl mx-auto">
      <HtmlCheckClient initialChecks={checks} />
    </div>
  );
}
