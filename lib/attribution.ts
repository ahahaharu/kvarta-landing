// Атрибуция рекламы (ТЗ, раздел 8): модель «последний рекламный переход».
// При загрузке метки из URL сохраняются на 30 дней, при отправке заявки
// уходят на сервер вместе с текущим page_url. Без React и без zod –
// модуль попадает в клиентский бандл, schema.ts берёт отсюда константы.

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

// Порядок – приоритет, если в ссылке несколько click id
export const CLICK_ID_TYPES = ["yclid", "fbclid", "gclid"] as const;

export type ClickIdType = (typeof CLICK_ID_TYPES)[number];

export const ATTRIBUTION_MAX = 500;
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const ATTRIBUTION_STORAGE_KEY = "kvarta:attribution";

type UtmKey = (typeof UTM_KEYS)[number];

export type Marks = Record<UtmKey, string | null> & {
  click_id: string | null;
  click_id_type: ClickIdType | null;
};

export type ClientAttribution = Marks & {
  referrer: string | null;
  landing_url: string | null;
  page_url: string | null;
  first_seen_at: string | null;
};

type Stored = Omit<ClientAttribution, "page_url"> & { expires_at: number };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const emptyMarks: Marks = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  click_id: null,
  click_id_type: null,
};

// Пустое → null, длинное обрезаем: тело запроса ограничено 10 КБ
function clip(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, ATTRIBUTION_MAX) || null;
}

function isClickIdType(value: unknown): value is ClickIdType {
  return CLICK_ID_TYPES.includes(value as ClickIdType);
}

/** Метки из адреса страницы; `null`, если нет ни одной */
export function parseMarks(href: string): Marks | null {
  let params: URLSearchParams;
  try {
    params = new URL(href).searchParams;
  } catch {
    return null;
  }

  const marks: Marks = { ...emptyMarks };
  for (const key of UTM_KEYS) marks[key] = clip(params.get(key));
  for (const type of CLICK_ID_TYPES) {
    const id = clip(params.get(type));
    if (id) {
      marks.click_id = id;
      marks.click_id_type = type;
      break;
    }
  }

  const found = Object.values(marks).some((value) => value !== null);
  return found ? marks : null;
}

/**
 * При загрузке страницы: есть метки → перезаписываем сохранённый набор.
 * Меток нет → ничего не трогаем: человек вернулся по закладке после рекламы.
 */
export function captureAttribution(
  href: string,
  referrer: string,
  storage: StorageLike | null,
  now: Date,
): void {
  const marks = parseMarks(href);
  if (!marks || !storage) return;

  const stored: Stored = {
    ...marks,
    referrer: clip(referrer),
    landing_url: clip(href),
    first_seen_at: now.toISOString(),
    expires_at: now.getTime() + ATTRIBUTION_TTL_MS,
  };
  try {
    storage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Приватный режим или переполнено – метки возьмём из URL при отправке
  }
}

function loadStored(
  storage: StorageLike | null,
  now: Date,
): Omit<ClientAttribution, "page_url"> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const record = data as Record<string, unknown>;

    if (
      typeof record.expires_at !== "number" ||
      record.expires_at <= now.getTime()
    ) {
      storage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    }

    return {
      utm_source: clip(record.utm_source),
      utm_medium: clip(record.utm_medium),
      utm_campaign: clip(record.utm_campaign),
      utm_content: clip(record.utm_content),
      utm_term: clip(record.utm_term),
      click_id: clip(record.click_id),
      click_id_type: isClickIdType(record.click_id_type)
        ? record.click_id_type
        : null,
      referrer: clip(record.referrer),
      landing_url: clip(record.landing_url),
      first_seen_at: clip(record.first_seen_at),
    };
  } catch {
    return null;
  }
}

/**
 * При отправке заявки: сохранённый переход + текущий page_url. Хранилище
 * недоступно или пусто → метки из текущего URL (встроенный браузер Instagram,
 * приватный режим), иначе только referrer – «прямой заход».
 */
export function readAttribution(
  href: string,
  referrer: string,
  storage: StorageLike | null,
  now: Date,
): ClientAttribution {
  const page_url = clip(href);
  const stored = loadStored(storage, now);
  if (stored) return { ...stored, page_url };

  const marks = parseMarks(href);
  return {
    ...(marks ?? emptyMarks),
    referrer: clip(referrer),
    landing_url: marks ? page_url : null,
    page_url,
    first_seen_at: null,
  };
}
