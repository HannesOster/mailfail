import { Hono } from "hono";
import type { SqliteDatabase } from "@mailfail/db/src/sqlite";
import * as inboxQueries from "@mailfail/db/src/queries/sqlite-inboxes";

export function inboxRoutes(db: SqliteDatabase) {
  const app = new Hono();

  // GET /api/inboxes
  app.get("/", (c) => {
    const inboxes = inboxQueries.listInboxes(db);
    return c.json(inboxes);
  });

  // POST /api/inboxes
  app.post("/", async (c) => {
    const body = await c.req.json();
    if (!body.name || typeof body.name !== "string") {
      return c.json({ error: "Name is required" }, 400);
    }
    const routeKey =
      body.routeKey ||
      body.name.toLowerCase().replace(/\s+/g, "-");
    const inbox = inboxQueries.createInbox(db, body.name, routeKey);
    return c.json(inbox, 201);
  });

  // GET /api/inboxes/:id
  app.get("/:id", (c) => {
    const inbox = inboxQueries.getInbox(db, c.req.param("id"));
    if (!inbox) return c.json({ error: "Inbox not found" }, 404);
    return c.json(inbox);
  });

  // DELETE /api/inboxes/:id
  app.delete("/:id", (c) => {
    inboxQueries.deleteInbox(db, c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
