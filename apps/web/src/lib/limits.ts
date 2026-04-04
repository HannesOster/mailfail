import { PLAN_LIMITS } from "@mailfail/shared";
import { db } from "./db";
import { isOwnerOrg } from "@mailfail/db/src/queries/organizations";
import { getInboxCount } from "@mailfail/db/src/queries/inboxes";

export async function checkInboxLimit(clerkOrgId: string, organizationId: string) {
  if (await isOwnerOrg(db, clerkOrgId)) return { allowed: true } as const;

  const count = await getInboxCount(db, organizationId);
  if (count >= PLAN_LIMITS.free.maxInboxes) {
    return { allowed: false, reason: "Inbox limit reached (1 inbox on Free plan)" } as const;
  }
  return { allowed: true } as const;
}

export async function checkMailLimit(
  clerkOrgId: string,
  monthlyMailCount: number,
) {
  if (await isOwnerOrg(db, clerkOrgId)) return { allowed: true } as const;

  if (monthlyMailCount >= PLAN_LIMITS.free.maxMailsPerMonth) {
    return {
      allowed: false,
      reason: "Monthly email limit reached (100 emails on Free plan)",
    } as const;
  }
  return { allowed: true } as const;
}

export async function checkHtmlCheckLimit(
  clerkOrgId: string,
  currentMonthCount: number,
) {
  if (await isOwnerOrg(db, clerkOrgId)) return { allowed: true } as const;

  if (currentMonthCount >= PLAN_LIMITS.free.maxHtmlChecksPerMonth) {
    return {
      allowed: false,
      reason: "Monthly HTML check limit reached (20 on Free plan)",
    } as const;
  }
  return { allowed: true } as const;
}
