// Отправка заявки из формы (ТЗ, разделы 5–6): один запрос с таймаутом 10 с,
// ответ сервера → исход, по которому форма выбирает состояние.
import type { ClientAttribution } from "@/lib/attribution";
import type { Interest } from "@/lib/content";
import { isFormField, type FormErrors } from "./form";

export const LEAD_ENDPOINT = "/api/lead";
export const SUBMIT_TIMEOUT_MS = 10_000;

export type LeadPayload = {
  name: string;
  phone: string;
  interest: Interest;
  comment: string;
  website: string;
  idempotencyKey: string;
  startedAt: number;
  attribution: ClientAttribution;
};

export type SubmitOutcome =
  | { kind: "success"; duplicate: boolean }
  | { kind: "validation"; fields: FormErrors }
  | { kind: "rate_limited" }
  | { kind: "network" }
  | { kind: "server" };

type SubmitOptions = {
  fetch?: typeof fetch;
  timeoutMs?: number;
};

// Ошибки только тех полей, что есть в форме; остальные (ключ, атрибуция) –
// баг клиента, человеку их не исправить
function pickFormErrors(fields: unknown): FormErrors {
  const result: FormErrors = {};
  if (typeof fields !== "object" || fields === null) return result;
  for (const [key, message] of Object.entries(fields)) {
    if (isFormField(key) && typeof message === "string") result[key] = message;
  }
  return result;
}

export async function submitLead(
  payload: LeadPayload,
  { fetch: doFetch = fetch, timeoutMs = SUBMIT_TIMEOUT_MS }: SubmitOptions = {},
): Promise<SubmitOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await doFetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as {
      duplicate?: unknown;
      error?: unknown;
      fields?: unknown;
    } | null;

    // Заявка записана, даже если тело ответа не дочитали
    if (response.ok) {
      return { kind: "success", duplicate: body?.duplicate === true };
    }
    if (response.status === 429) return { kind: "rate_limited" };
    if (response.status === 400 && body?.error === "validation") {
      const fields = pickFormErrors(body.fields);
      if (Object.keys(fields).length > 0) return { kind: "validation", fields };
    }
    return { kind: "server" };
  } catch {
    // Обрыв сети или таймаут: «Повторить» отправит тот же idempotencyKey
    return { kind: "network" };
  } finally {
    clearTimeout(timer);
  }
}

type CryptoLike = Pick<Crypto, "getRandomValues"> & {
  randomUUID?: () => string;
};

/** UUID v4; randomUUID есть только в secure context, на http – getRandomValues */
export function createIdempotencyKey(source: CryptoLike = crypto): string {
  if (typeof source.randomUUID === "function") return source.randomUUID();

  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
