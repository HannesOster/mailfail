export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { listHtmlChecks } from "@mailfail/db/src/queries/html-checks";
import { HtmlCheckClient } from "./html-check-client";

export default async function HtmlCheckPage() {
  const { user } = await requireAuth();
  const checks = await listHtmlChecks(db, user.id);

  return (
    <div className="max-w-5xl mx-auto">
      <HtmlCheckClient initialChecks={checks} />
    </div>
  );
}
