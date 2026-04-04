export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { getEmail } from "@mailfail/db/src/queries/emails";
import { getValidationForEmail } from "@mailfail/db/src/queries/validation";
import { EmailDetailClient } from "./email-detail-client";

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string; mailId: string }>;
}) {
  const { id, mailId } = await params;
  const { user } = await requireAuth();

  const inbox = await getInbox(db, id, user.id);
  if (!inbox) notFound();

  const email = await getEmail(db, mailId, id);
  if (!email) notFound();

  const validation = await getValidationForEmail(db, mailId);

  return (
    <div className="max-w-7xl mx-auto">
      <EmailDetailClient
        inboxId={id}
        inboxName={inbox.name}
        email={email}
        initialValidation={validation}
        smtpHost={process.env.SMTP_HOST ?? "smtp.mailfail.dev"}
        smtpUser={inbox.smtpUser}
      />
    </div>
  );
}
