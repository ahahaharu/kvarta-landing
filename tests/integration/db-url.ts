// База для integration-тестов: локально – kvarta_test в Docker, в CI – service container.
// .env.local не читаем: тесты не должны случайно попасть в рабочую базу.
export const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  "postgres://kvarta:kvarta@localhost:5433/kvarta_test";

/** Тесты чистят таблицы – только в базе с суффиксом _test */
export function assertTestDatabase(url: string): void {
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(`Refusing to run integration tests against "${name}"`);
  }
}
