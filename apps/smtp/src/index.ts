import "dotenv/config";
import { createDb } from "@mailfail/db";
import { SMTP_CONFIG } from "@mailfail/shared";
import { createSmtpServer } from "./server";
import { createHealthServer } from "./health";

const db = createDb(process.env.DATABASE_URL!);

const smtpServer = createSmtpServer(
  db,
  process.env.UPSTASH_REDIS_REST_URL!,
  process.env.UPSTASH_REDIS_REST_TOKEN!,
);

const port = Number(process.env.SMTP_PORT) || SMTP_CONFIG.port;

smtpServer.listen(port, "0.0.0.0", () => {
  console.log(`SMTP server listening on port ${port}`);
});

createHealthServer(Number(process.env.HEALTH_PORT) || 3001);

smtpServer.on("error", (err) => {
  console.error("SMTP server error:", err);
});
