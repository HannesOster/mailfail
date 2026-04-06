import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import type { SqliteDatabase } from "@mailfail/db/src/sqlite";
import { inboxRoutes } from "./routes/inboxes.js";
import { emailRoutes } from "./routes/emails.js";
import { forwardRoutes } from "./routes/forward.js";
import { streamRoutes } from "./routes/stream.js";
import path from "path";
import { fileURLToPath } from "url";

export function createApp(db: SqliteDatabase) {
  const app = new Hono();

  app.use("*", cors());

  // API routes
  app.route("/api/inboxes", inboxRoutes(db));

  // Nested routes with :id param — Hono propagates parent params
  app.route("/api/inboxes/:id/emails", emailRoutes(db));
  app.route("/api/inboxes/:id/emails", forwardRoutes(db));
  app.route("/api/inboxes/:id/stream", streamRoutes());

  // Static files — serve from ui/ relative to this file
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const uiDir = path.join(__dirname, "ui");

  app.use("/*", serveStatic({ root: uiDir }));

  // SPA fallback — serve index.html for non-API routes
  app.get("*", serveStatic({ root: uiDir, path: "index.html" }));

  return app;
}
