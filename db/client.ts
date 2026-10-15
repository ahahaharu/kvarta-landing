// Подключение к Postgres: локально Docker, на Vercel – pooled-строка Neon.
// Создаётся при первом запросе, а не при импорте: сборке страницы база не нужна.
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

// В dev модуль перезагружается на каждую правку – держим одно подключение в globalThis
const globalForDb = globalThis as unknown as { kvartaSql?: postgres.Sql };

export function getDb(): Db {
  if (!globalForDb.kvartaSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.kvartaSql = postgres(url, {
      // Пулер Neon работает в transaction mode – без именованных prepared statements
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return drizzle(globalForDb.kvartaSql, { schema });
}

/** Для тестов: закрыть подключение, чтобы процесс Vitest завершился */
export async function closeDb(): Promise<void> {
  await globalForDb.kvartaSql?.end();
  globalForDb.kvartaSql = undefined;
}
