import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: [
      "packages/**/*.test.ts",
      "apps/bridge/**/*.test.ts",
      "tests/unit/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
  },
});
