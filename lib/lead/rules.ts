// Правила полей заявки без zod (ТЗ, раздел 5). Их же использует schema.ts.
// Форма проверяет поля на blur через этот модуль: zod на клиенте съел бы
// бо́льшую часть бюджета клиентского JS (15 КБ gzip).

export { normalizeByPhone } from "./phone";

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const COMMENT_MAX = 500;

export function isValidName(value: string): boolean {
  const length = value.trim().length;
  return length >= NAME_MIN && length <= NAME_MAX;
}

export function isValidComment(value: string): boolean {
  return value.trim().length <= COMMENT_MAX;
}
