import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    exclude: [".next/**", "node_modules/**"],
    testTimeout: 30000,
    server: {
      deps: {
        inline: ["@better-auth"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      include: ["lib/**/*.ts", "app/api/**/route.ts"],
      exclude: ["**/*.d.ts"],
      thresholds: {
        statements: 48,
        branches: 44,
        functions: 58,
        lines: 49,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
