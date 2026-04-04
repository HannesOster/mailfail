export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { listInboxes } from "@mailfail/db/src/queries/inboxes";
import { InboxListClient } from "./inbox-list-client";

export default async function InboxesPage() {
  const { org } = await requireOrg();
  const inboxes = await listInboxes(db, org.id);

  return (
    <div className="max-w-5xl mx-auto">
      <InboxListClient initialInboxes={inboxes} smtpHost={process.env.SMTP_HOST ?? "smtp.mailfail.dev"} />
    </div>
  );
}
