export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { listEmails } from "@mailfail/db/src/queries/emails";
import { InboxDetailClient } from "./inbox-detail-client";

export default async function InboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireAuth();

  const inbox = await getInbox(db, id, user.id);
  if (!inbox) notFound();

  const emails = await listEmails(db, id, { limit: 50, offset: 0 });

  return (
    <div className="max-w-6xl mx-auto">
      <InboxDetailClient
        inbox={inbox}
        initialEmails={emails}
        smtpHost={process.env.SMTP_HOST ?? "localhost"}
      />
    </div>
  );
}
