export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { listEmails } from "@mailfail/db/src/queries/emails";
import { getValidationsForEmails } from "@mailfail/db/src/queries/validation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { inbox } = await requireAuth();

  const emails = await listEmails(db, inbox.id, { limit: 50, offset: 0 });
  const emailIds = emails.map((e) => e.id);
  const validations = await getValidationsForEmails(db, emailIds);

  return (
    <DashboardClient
      inbox={inbox}
      initialEmails={emails}
      initialValidations={validations}
      smtpHost={process.env.SMTP_HOST ?? "smtp.mailfail.dev"}
    />
  );
}
