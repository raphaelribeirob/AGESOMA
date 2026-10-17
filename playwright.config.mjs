import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.AGESOMA_QA_BASE_URL || "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["json", { outputFile: "qa-artifacts/browser-results.json" }]
  ],
  outputDir: "qa-artifacts/test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "chromium-android", use: { ...devices["Pixel 7"], browserName: "chromium" } },
    { name: "webkit-iphone", use: { ...devices["iPhone 13"], browserName: "webkit" } }
  ],
  webServer: process.env.AGESOMA_QA_EXTERNAL
    ? undefined
    : {
        command: "npm run start --workspace @agesoma/web -- --port 3100",
        url: baseURL + "/instant",
        timeout: 120_000,
        reuseExistingServer: false,
        env: {
          BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
          DATABASE_URL: process.env.DATABASE_URL ?? ""
        }
      }
});
