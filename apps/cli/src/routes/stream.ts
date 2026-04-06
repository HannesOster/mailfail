import { Hono } from "hono";
import { bus } from "../events.js";

export function streamRoutes() {
  const app = new Hono();

  // GET /api/inboxes/:id/stream
  app.get("/", (c) => {
    const inboxId = c.req.param("id");
    const encoder = new TextEncoder();

    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const unsubscribe = bus.onSseEvent((event) => {
          if (event.inboxId === inboxId) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
              );
            } catch {
              unsubscribe();
            }
          }
        });

        // Keepalive
        const keepalive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            clearInterval(keepalive);
            unsubscribe();
          }
        }, 30_000);

        cleanup = () => {
          clearInterval(keepalive);
          unsubscribe();
        };
      },
      cancel() {
        cleanup?.();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  return app;
}
