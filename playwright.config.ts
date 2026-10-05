import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.test.ts",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  retries: 0,
  workers: 1,
  reporters: [["html", { open: "never" }], ["list"]],
});
