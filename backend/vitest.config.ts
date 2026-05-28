import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      bun: path.resolve(__dirname, "./src/test/mocks/bun-password.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["src/**/*.e2e.test.ts"],
  },
});
