// Уведомление менеджеру о новой заявке (ТЗ, раздел 11): Bot API sendMessage
// с parse_mode HTML. Без React и без Next – env и fetch передаются параметрами,
// поэтому модуль тестируется без сети. Никогда не бросает: заявка уже сохранена.
import { interestLabels, leadNotice } from "@/lib/content";
import { formatByPhone } from "./phone";
import type { Lead } from "./schema";

type Env = Record<string, string | undefined>;

export const TELEGRAM_TIMEOUT_MS = 5000;
const ATTEMPTS = 2;

export type TelegramStatus = "sent" | "failed" | "skipped";

export type NotifyResult = { status: TelegramStatus; error?: string };

export type LeadNotice = Pick<
  Lead,
  "name" | "phone" | "interest" | "comment" | "attribution"
> & { userAgent: string | null };

type TelegramConfig = { token: string; chatId: string };

/** Не заданы токен или чат → уведомление пропускаем (так в Preview и в тестах) */
export function getTelegramConfig(
  env: Env = process.env,
): TelegramConfig | null {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  return token && chatId ? { token, chatId } : null;
}

/** В режиме HTML Telegram требует экранировать только эти три символа */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function host(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

// Менеджеру важен раздел страницы, а не UTM-хвост: `/#order`
function pagePath(url: string): string {
  try {
    const { pathname, hash } = new URL(url);
    return pathname + hash;
  } catch {
    return url;
  }
}

/** Грубо по user agent: «Телефон (iOS)». iPad в Safari притворяется Mac */
export function describeDevice(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const { phone, tablet, desktop } = leadNotice.devices;
  if (/iPhone|iPod/.test(userAgent)) return `${phone} (iOS)`;
  if (/iPad/.test(userAgent)) return `${tablet} (iPadOS)`;
  if (/Android/.test(userAgent)) {
    return `${/Mobile/.test(userAgent) ? phone : tablet} (Android)`;
  }
  if (/Windows/.test(userAgent)) return `${desktop} (Windows)`;
  if (/Macintosh/.test(userAgent)) return `${desktop} (macOS)`;
  if (/Linux|CrOS/.test(userAgent)) return desktop;
  return null;
}

function source(a: Lead["attribution"]): string {
  if (a.utm_source) {
    return [a.utm_source, a.utm_medium].filter(Boolean).join(" / ");
  }
  if (a.click_id_type) return leadNotice.ad(a.click_id_type);
  return [leadNotice.direct, a.referrer && host(a.referrer)]
    .filter(Boolean)
    .join(" / ");
}

// Пустые части пропускаем, пустую строку – целиком
function line(...parts: (string | null)[]): string | null {
  const present = parts.filter(Boolean);
  return present.length > 0 ? present.join(" · ") : null;
}

function field(label: string, value: string | null): string | null {
  return value ? `${label}: ${value}` : null;
}

/** Текст сообщения; все пользовательские строки уже экранированы */
export function formatLeadMessage(notice: LeadNotice): string {
  const a = notice.attribution;
  const e = (value: string | null) => (value ? escapeHtml(value) : null);

  const lead = [
    `<b>${leadNotice.title(interestLabels[notice.interest])}</b>`,
    `${e(notice.name)} · ${formatByPhone(notice.phone)}`,
    `${leadNotice.comment}: ${e(notice.comment) ?? leadNotice.empty}`,
  ];
  const origin = [
    field(leadNotice.source, e(source(a))),
    line(
      field(leadNotice.campaign, e(a.utm_campaign)),
      field(leadNotice.content, e(a.utm_content)),
    ),
    line(
      field(leadNotice.page, e(a.page_url && pagePath(a.page_url))),
      describeDevice(notice.userAgent),
    ),
  ].filter((l): l is string => l !== null);

  return [...lead, "", ...origin].join("\n");
}

type TelegramResponse = { ok: boolean; description?: string };

// Ответ 4xx не исправится повтором (неверный чат, бот удалён из группы);
// 429 и 5xx – временные
function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

type NotifyOptions = {
  env?: Env;
  fetch?: typeof fetch;
  timeoutMs?: number;
};

/**
 * Отправляет заявку в чат менеджеров: таймаут 5 с, один повтор. Ошибку
 * возвращает строкой для лога – без токена, он есть в адресе запроса.
 */
export async function notifyTelegram(
  notice: LeadNotice,
  {
    env = process.env,
    fetch: fetchFn = fetch,
    timeoutMs = TELEGRAM_TIMEOUT_MS,
  }: NotifyOptions = {},
): Promise<NotifyResult> {
  const config = getTelegramConfig(env);
  if (!config) return { status: "skipped" };

  const url = `https://api.telegram.org/bot${config.token}/sendMessage`;
  const body = JSON.stringify({
    chat_id: config.chatId,
    text: formatLeadMessage(notice),
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });

  let error = "";
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetchFn(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return { status: "sent" };

      const data = (await response
        .json()
        .catch(() => ({}))) as Partial<TelegramResponse>;
      error = `HTTP ${response.status}: ${data.description ?? "no description"}`;
      if (!isRetryable(response.status)) break;
    } catch (cause) {
      const { name, message } = cause as Error;
      error = `${name}: ${message}`.replaceAll(config.token, "***");
    }
  }
  return { status: "failed", error };
}
