import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 4310);
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E smoke tests. They exercise the real app in a browser but mock the
 * provider call (`/api/generate`), so no API key ever leaves the browser and
 * the suite is deterministic. See e2e/smoke.spec.ts.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
