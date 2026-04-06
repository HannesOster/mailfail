import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: false, // Don't clean — UI build writes to dist/ui/
  splitting: false,
  sourcemap: false,
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
  noExternal: [
    "@mailfail/db",
    "@mailfail/shared",
    "@mailfail/smtp",
    "@mailfail/validation",
  ],
  external: [
    "better-sqlite3",
    "smtp-server",
  ],
});
