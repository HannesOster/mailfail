import { eq } from "drizzle-orm";
import type { Database } from "..";
import { organizations } from "../schema";

export async function getOrCreateOrganization(
  db: Database,
  clerkOrgId: string,
  name: string,
) {
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const isOwner = clerkOrgId === process.env.OWNER_ORG_ID;

  const [org] = await db
    .insert(organizations)
    .values({ clerkOrgId, name, isOwner })
    .returning();

  return org;
}

export async function isOwnerOrg(db: Database, clerkOrgId: string): Promise<boolean> {
  const [org] = await db
    .select({ isOwner: organizations.isOwner })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
    .limit(1);

  return org?.isOwner ?? false;
}

export async function getOrganizationByClerkId(db: Database, clerkOrgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
    .limit(1);

  return org ?? null;
}
