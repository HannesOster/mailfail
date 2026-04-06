#!/usr/bin/env node
import { Command } from "commander";
import { serve } from "@hono/node-server";
import { resolveConfig } from "./config.js";
import { initDatabase } from "./db.js";
import { createStorage } from "./storage.js";
import { createLocalSmtpServer } from "./smtp.js";
import { createApp } from "./server.js";
const VERSION = "1.0.0";

function checkPort(port: number, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const net = require("net");
    const tester = net.createServer();
    tester.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} is already in use. Choose a different ${name} port with --${name === "SMTP" ? "smtp-port" : "ui-port"}.`));
      } else {
        reject(err);
      }
    });
    tester.once("listening", () => {
      tester.close(() => resolve());
    });
    tester.listen(port);
  });
}

const program = new Command()
  .name("mailfail")
  .description("Local email catching & validation tool")
  .version(VERSION)
  .option("--smtp-port <port>", "SMTP server port", parseInt)
  .option("--ui-port <port>", "Web UI port", parseInt)
  .option("--dir <path>", "Data directory")
  .option("--open", "Open browser on start")
  .option("--no-ui", "Run SMTP server only, no web UI")
  .action(async (opts) => {
    const config = resolveConfig({
      smtpPort: opts.smtpPort,
      uiPort: opts.uiPort,
      dataDir: opts.dir,
      open: opts.open,
      noUi: opts.ui === false,
    });

    // Check ports before starting
    try {
      await checkPort(config.smtpPort, "SMTP");
      if (!config.noUi) {
        await checkPort(config.uiPort, "UI");
      }
    } catch (err: any) {
      console.error(`\n  \x1b[31mError:\x1b[0m ${err.message}\n`);
      process.exit(1);
    }

    // Init database
    const db = initDatabase(config.dataDir);
    const storage = createStorage(config.dataDir);

    // Start SMTP server
    const smtpServer = createLocalSmtpServer(db, storage);
    smtpServer.listen(config.smtpPort, () => {});

    // Start HTTP server (unless --no-ui)
    let httpServer: ReturnType<typeof serve> | undefined;
    if (!config.noUi) {
      const app = createApp(db);
      httpServer = serve({ fetch: app.fetch, port: config.uiPort }, () => {});
    }

    // Print startup message
    console.log("");
    console.log(`  \x1b[1m\x1b[36mMailFail\x1b[0m v${VERSION}`);
    console.log("");
    console.log(`  SMTP  → localhost:${config.smtpPort}`);
    if (!config.noUi) {
      console.log(`  UI    → http://localhost:${config.uiPort}`);
    }
    console.log(`  Data  → ${config.dataDir}/`);
    console.log("");
    console.log(`  SMTP_HOST=localhost`);
    console.log(`  SMTP_PORT=${config.smtpPort}`);
    console.log(`  SMTP_USER=dev`);
    console.log(`  SMTP_PASS=dev`);
    console.log("");
    console.log("  Ready to catch emails!");
    console.log("");

    // Open browser
    if (config.open && !config.noUi) {
      const openModule = await import("open");
      openModule.default(`http://localhost:${config.uiPort}`);
    }

    // Graceful shutdown
    const shutdown = () => {
      console.log("\n  Shutting down...");
      smtpServer.close(() => {
        if (httpServer) {
          httpServer.close(() => process.exit(0));
        } else {
          process.exit(0);
        }
      });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });

program.parse();
