import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@mailfail/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
});
