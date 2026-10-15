import { defineConfig } from "drizzle-kit";

// drizzle-kit сам не читает .env.local. На Vercel файла нет – переменные уже в окружении.
try {
  process.loadEnvFile(".env.local");
} catch {}

// Миграциям нужно прямое подключение: на Neon это DATABASE_URL_UNPOOLED, локально хватает DATABASE_URL.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set");

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
