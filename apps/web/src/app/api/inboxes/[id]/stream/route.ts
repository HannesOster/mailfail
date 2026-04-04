import { redis } from "@/lib/redis";
import { requireOrg } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org } = await requireOrg();
  const { id } = await params;

  const inbox = await getInbox(db, id, org.id);
  if (!inbox) {
    return new Response("Inbox not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const channelName = `inbox:${id}`;

      const interval = setInterval(async () => {
        try {
          const message = await redis.lpop<string>(channelName);
          if (message) {
            controller.enqueue(
              encoder.encode(`data: ${typeof message === "string" ? message : JSON.stringify(message)}\n\n`),
            );
          }
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
          clearInterval(interval);
        }
      }, 30_000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
