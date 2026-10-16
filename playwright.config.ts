import { defineConfig, devices } from "@playwright/test";
import { TEST_DATABASE_URL } from "./tests/integration/db-url";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // Аудитория приходит из Instagram на iPhone – мобильный проект на WebKit
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  // Свой сервер поднимаем, только если тестируем локально, а не превью-деплой.
  // В CI – прод-сборка: проверяем то, что уедет на Vercel
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "pnpm start" : "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        // Заявки из тестов – в kvarta_test, а не в базу из .env.local,
        // и не в чат менеджеров: пустое значение Next не перезаписывает
        env: {
          DATABASE_URL: TEST_DATABASE_URL,
          TELEGRAM_BOT_TOKEN: "",
          TELEGRAM_CHAT_ID: "",
        },
        timeout: 120_000,
      },
});
