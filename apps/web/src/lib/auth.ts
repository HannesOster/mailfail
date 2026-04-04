import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { getOrCreateUser, getUserByApiKey } from "@mailfail/db/src/queries/users";
import { listInboxes, createInbox } from "@mailfail/db/src/queries/inboxes";

export async function requireAuth() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const clerkUser = await currentUser();
  const user = await getOrCreateUser(
    db,
    clerkUserId,
    clerkUser?.emailAddresses[0]?.emailAddress,
    clerkUser?.fullName ?? clerkUser?.firstName ?? undefined,
  );

  // Auto-create inbox if user doesn't have one (single query in common case)
  const [existingInbox] = await listInboxes(db, user.id);
  const inbox = existingInbox ?? (await createInbox(db, user.id, "My Inbox"));

  return { clerkUserId, user, inbox };
}

export async function requireAuthFromRequest(request: Request) {
  // Check Bearer token for API access
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer mf_")) {
    const apiKey = authHeader.slice(7);
    const user = await getUserByApiKey(db, apiKey);
    if (user) return { clerkUserId: user.clerkUserId, user };
  }

  // Fall back to Clerk session
  return requireAuth();
}
