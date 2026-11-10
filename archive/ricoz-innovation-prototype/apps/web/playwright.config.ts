import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        (process.platform === "win32"
          ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
          : undefined),
    },
  },
  webServer: [
    {
      command: "npm --prefix ../api run e2e:server",
      url: "http://127.0.0.1:4100/api/v1/ready",
      timeout: 180000,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --port 3100",
      url: "http://localhost:3100",
      env: { API_ORIGIN: "http://127.0.0.1:4100", NEXT_DIST_DIR: '.next-e2e' },
      timeout: 180000,
      reuseExistingServer: false,
    },
  ],
});
