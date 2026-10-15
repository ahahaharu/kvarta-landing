import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/integration/db-url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Логи API показываем только у упавших тестов
    silent: "passed-only",
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"] },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          // Файлы делят одну базу kvarta_test и чистят её перед каждым тестом
          fileParallelism: false,
          env: {
            DATABASE_URL: TEST_DATABASE_URL,
            NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
            IP_HASH_SALT: "test-salt",
          },
        },
      },
    ],
  },
});
