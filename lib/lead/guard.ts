// Защита POST /api/lead до записи в БД (ТЗ, раздел 10): Origin, хеш IP, фильтр ботов.
// Без React и без Next – функции принимают заголовки и env, их легко тестировать.
import { createHash } from "node:crypto";

type Env = Record<string, string | undefined>;

const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

/** Минимальное время заполнения формы: быстрее – бот */
export const MIN_FILL_MS = 3000;

export const USER_AGENT_MAX = 200;

function toOrigin(value: string | undefined, protocol = "https://") {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : protocol + value).origin;
  } catch {
    return null;
  }
}

/**
 * Свой домен и превью Vercel этого проекта. Vercel отдаёт хосты без протокола:
 * VERCEL_URL – адрес деплоя, VERCEL_BRANCH_URL – адрес ветки.
 */
export function allowedOrigins(env: Env = process.env): Set<string> {
  const origins = [
    toOrigin(env.NEXT_PUBLIC_SITE_URL),
    toOrigin(env.VERCEL_PROJECT_PRODUCTION_URL),
    toOrigin(env.VERCEL_URL),
    toOrigin(env.VERCEL_BRANCH_URL),
    ...(env.NODE_ENV === "production" ? [] : DEV_ORIGINS),
  ];
  return new Set(origins.filter((o): o is string => o !== null));
}

/** Браузер всегда шлёт Origin с POST – запрос без него тоже чужой */
export function isAllowedOrigin(
  origin: string | null,
  env: Env = process.env,
): boolean {
  return origin !== null && allowedOrigins(env).has(origin);
}

/**
 * Vercel перезаписывает x-forwarded-for, а не дописывает в конец: присланное
 * клиентом значение до функции не доходит, подделать IP нельзя.
 * https://vercel.com/docs/headers/request-headers#x-forwarded-for
 * Запятые и x-real-ip – для локального запуска за другими прокси.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** Соль обязательна в production: без неё IPv4 восстанавливается перебором */
export function getIpSalt(env: Env = process.env): string {
  const salt = env.IP_HASH_SALT;
  if (salt) return salt;
  if (env.NODE_ENV === "production") {
    throw new Error("IP_HASH_SALT is not set");
  }
  return "dev-only-salt";
}

/** SHA-256(IP + соль) в hex; сам IP не храним */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256")
    .update(ip + salt)
    .digest("hex");
}

/**
 * Honeypot заполнен или форму отправили быстрее 3 с. Отрицательное время
 * (часы телефона спешат) ботом не считаем – иначе молча потеряем живую заявку.
 */
export function isBot(
  lead: { website: string; startedAt: number },
  now: number = Date.now(),
): boolean {
  if (lead.website.trim() !== "") return true;
  const elapsed = now - lead.startedAt;
  return elapsed >= 0 && elapsed < MIN_FILL_MS;
}

export function trimUserAgent(value: string | null): string | null {
  return value?.slice(0, USER_AGENT_MAX) || null;
}
