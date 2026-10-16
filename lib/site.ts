// Адрес сайта для metadata, OG, sitemap и JSON-LD. Без Next – env передаётся параметром.

type Env = Record<string, string | undefined>;

const DEV_URL = "http://localhost:3000";

/** Vercel отдаёт хосты без протокола – дописываем https:// */
export function toOrigin(value: string | undefined, protocol = "https://") {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : protocol + value).origin;
  } catch {
    return null;
  }
}

/**
 * Свой домен из NEXT_PUBLIC_SITE_URL, иначе прод-адрес проекта на Vercel.
 * На превью тоже прод-адрес: ссылки в превью и sitemap ведут на прод.
 */
export function siteUrl(env: Env = process.env): URL {
  return new URL(
    toOrigin(env.NEXT_PUBLIC_SITE_URL) ??
      toOrigin(env.VERCEL_PROJECT_PRODUCTION_URL) ??
      DEV_URL,
  );
}
