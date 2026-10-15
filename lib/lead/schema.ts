// Схема заявки для POST /api/lead (ТЗ, разделы 5, 6, 8, 10). Сервер не доверяет
// клиенту и повторяет всю валидацию; правила полей – из rules.ts, тексты – из content.ts.
// Только для сервера: в форму импортируем rules.ts, а не этот файл (zod – ~25 КБ gzip).
import { z } from "zod";
import { interestLabels, order, type Interest } from "@/lib/content";
import { COMMENT_MAX, NAME_MAX, NAME_MIN, normalizeByPhone } from "./rules";

const errors = order.form.errors;

export const INTERESTS = Object.keys(interestLabels) as [
  Interest,
  ...Interest[],
];

export const CLICK_ID_TYPES = ["yclid", "fbclid", "gclid"] as const;

export const ATTRIBUTION_MAX = 500;
// С запасом на скобки, пробелы и дефисы вокруг 12 цифр
const PHONE_RAW_MAX = 32;
const HONEYPOT_MAX = 500;

// Атрибуция не должна стоить заявки: кривое значение → null, длинное – обрезаем
const attrText = z
  .string()
  .transform((v) => v.trim().slice(0, ATTRIBUTION_MAX) || null)
  .nullable()
  .catch(null);

const attributionSchema = z.object({
  utm_source: attrText,
  utm_medium: attrText,
  utm_campaign: attrText,
  utm_content: attrText,
  utm_term: attrText,
  click_id: attrText,
  click_id_type: z.enum(CLICK_ID_TYPES).nullable().catch(null),
  referrer: attrText,
  landing_url: attrText,
  page_url: attrText,
  first_seen_at: z.iso.datetime().nullable().catch(null),
});

export type Attribution = z.output<typeof attributionSchema>;

export const emptyAttribution: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  click_id: null,
  click_id_type: null,
  referrer: null,
  landing_url: null,
  page_url: null,
  first_seen_at: null,
};

export const leadSchema = z.strictObject({
  name: z
    .string({ error: errors.name })
    .trim()
    .min(NAME_MIN, { error: errors.name })
    .max(NAME_MAX, { error: errors.name }),
  phone: z
    .string({ error: errors.phone })
    .max(PHONE_RAW_MAX, { error: errors.phone })
    .refine((v) => normalizeByPhone(v) !== null, { error: errors.phone })
    .transform((v) => normalizeByPhone(v) as string),
  interest: z.enum(INTERESTS).default("subscription"),
  comment: z
    .string({ error: errors.comment })
    .trim()
    .max(COMMENT_MAX, { error: errors.comment })
    .default(""),
  // Honeypot: валиден любой текст, решение «тихий 201» принимает сервер
  website: z.string().max(HONEYPOT_MAX).default(""),
  idempotencyKey: z.uuid(),
  // Время открытия формы, мс с эпохи: младше 3 с → бот (раздел 10)
  startedAt: z.int().nonnegative(),
  attribution: attributionSchema.catch(emptyAttribution),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

/** Поле → первый текст ошибки. Лишние ключи тоже попадают сюда (раздел 10). */
export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const keys =
      issue.code === "unrecognized_keys"
        ? issue.keys
        : [String(issue.path[0] ?? "_root")];
    for (const key of keys) fields[key] ??= issue.message;
  }
  return fields;
}

export type ParseLeadResult =
  { ok: true; data: Lead } | { ok: false; fields: FieldErrors };

export function parseLead(input: unknown): ParseLeadResult {
  const result = leadSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, fields: toFieldErrors(result.error) };
}
