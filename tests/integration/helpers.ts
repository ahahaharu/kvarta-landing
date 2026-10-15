import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { afterAll, beforeEach } from "vitest";
import { closeDb, getDb } from "@/db/client";
import { leads } from "@/db/schema";
import { assertTestDatabase } from "./db-url";

export const SITE = "http://localhost:3000";

/** Чистая таблица перед каждым тестом, закрытое подключение в конце файла */
export function withCleanDb() {
  beforeEach(async () => {
    assertTestDatabase(process.env.DATABASE_URL!);
    await getDb().execute(sql`truncate table ${leads}`);
  });
  afterAll(closeDb);
}

/**
 * Открыть все подключения пула заранее. Иначе параллельные запросы встают
 * в очередь к единственному открытому подключению, пока остальные проходят
 * рукопожатие, – гонки нет, и тест на блокировки проходит даже без них.
 */
export async function warmPool(size = 5) {
  await Promise.all(
    Array.from({ length: size }, () =>
      getDb().execute(sql`select pg_sleep(0.05)`),
    ),
  );
}

export function validLead(patch: Record<string, unknown> = {}) {
  return {
    name: "Анна",
    phone: "+375 29 123-45-67",
    interest: "subscription",
    comment: "",
    website: "",
    idempotencyKey: randomUUID(),
    // Форму открыли 10 с назад – не бот
    startedAt: Date.now() - 10_000,
    ...patch,
  };
}

type RequestOptions = {
  origin?: string | null;
  ip?: string;
  contentType?: string;
  headers?: Record<string, string>;
};

export function leadRequest(
  body: unknown,
  {
    origin = SITE,
    ip = "203.0.113.1",
    contentType = "application/json",
    headers = {},
  }: RequestOptions = {},
): Request {
  return new Request(`${SITE}/api/lead`, {
    method: "POST",
    headers: {
      "content-type": contentType,
      "x-forwarded-for": ip,
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      ...(origin === null ? {} : { origin }),
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export async function countLeads(): Promise<number> {
  return getDb().$count(leads);
}
