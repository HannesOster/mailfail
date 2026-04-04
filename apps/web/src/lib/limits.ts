import { PLAN_LIMITS, BILLING_ENABLED } from "@mailfail/shared";
import { db } from "./db";
import { isOwnerUser } from "@mailfail/db/src/queries/users";
import { getInboxCount } from "@mailfail/db/src/queries/inboxes";

export async function checkInboxLimit(clerkUserId: string, userId: string) {
  if (!BILLING_ENABLED) return { allowed: true } as const;
  if (await isOwnerUser(db, clerkUserId)) return { allowed: true } as const;

  const count = await getInboxCount(db, userId);
  if (count >= PLAN_LIMITS.free.maxInboxes) {
    return { allowed: false, reason: "Inbox limit reached (1 inbox on Free plan)" } as const;
  }
  return { allowed: true } as const;
}

export async function checkMailLimit(clerkUserId: string, monthlyMailCount: number) {
  if (!BILLING_ENABLED) return { allowed: true } as const;
  if (await isOwnerUser(db, clerkUserId)) return { allowed: true } as const;

  if (monthlyMailCount >= PLAN_LIMITS.free.maxMailsPerMonth) {
    return { allowed: false, reason: "Monthly email limit reached" } as const;
  }
  return { allowed: true } as const;
}

export async function checkHtmlCheckLimit(clerkUserId: string, currentMonthCount: number) {
  if (!BILLING_ENABLED) return { allowed: true } as const;
  if (await isOwnerUser(db, clerkUserId)) return { allowed: true } as const;

  if (currentMonthCount >= PLAN_LIMITS.free.maxHtmlChecksPerMonth) {
    return { allowed: false, reason: "Monthly HTML check limit reached" } as const;
  }
  return { allowed: true } as const;
}
