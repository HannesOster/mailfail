import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { Database } from "..";
import { users } from "../schema";

export async function getOrCreateUser(
  db: Database,
  clerkUserId: string,
  email?: string,
  name?: string,
) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const isOwner = clerkUserId === process.env.OWNER_ORG_ID;

  const [user] = await db
    .insert(users)
    .values({ clerkUserId, email, name, isOwner })
    .returning();

  return user;
}

export async function isOwnerUser(db: Database, clerkUserId: string): Promise<boolean> {
  const [user] = await db
    .select({ isOwner: users.isOwner })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return user?.isOwner ?? false;
}

export async function getUserByClerkId(db: Database, clerkUserId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return user ?? null;
}

export async function generateApiKey(db: Database, userId: string) {
  const apiKey = `mf_${randomBytes(32).toString("hex")}`;
  const [updated] = await db
    .update(users)
    .set({ apiKey })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function getUserByApiKey(db: Database, apiKey: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.apiKey, apiKey))
    .limit(1);
  return user ?? null;
}
