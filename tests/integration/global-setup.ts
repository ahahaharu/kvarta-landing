// Один раз перед integration-тестами: применить миграции к kvarta_test
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { TEST_DATABASE_URL, assertTestDatabase } from "./db-url";

export default async function setup() {
  assertTestDatabase(TEST_DATABASE_URL);
  const sql = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "db/migrations" });
  } finally {
    await sql.end();
  }
}
