import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { getOrCreateOrganization } from "@mailfail/db/src/queries/organizations";

export async function requireOrg() {
  const { userId, orgId, orgSlug } = await auth();

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (!orgId) {
    throw new Response("No organization selected", { status: 403 });
  }

  const org = await getOrCreateOrganization(db, orgId, orgSlug ?? "default");

  return { userId, orgId, org };
}
