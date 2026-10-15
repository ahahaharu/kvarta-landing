// Белорусские мобильные номера (ТЗ, раздел 5). Без зависимостей от React –
// одни и те же функции работают в форме и в Route Handler.

const MOBILE_CODES = ["25", "29", "33", "44"];

// Разделители, которые человек ставит сам или приносит при вставке
const SEPARATORS = /[\s()-]/g;

/**
 * Приводит номер к виду `+375XXXXXXXXX` или возвращает `null`.
 * Принимает `+375 29 123-45-67`, `375291234567`, `80291234567`,
 * `8 (029) 123-45-67`, `291234567`. Отклоняет городские, чужие коды стран,
 * лишние или недостающие цифры и буквы.
 */
export function normalizeByPhone(input: string): string | null {
  const compact = input.replace(SEPARATORS, "");
  if (!/^\+?\d+$/.test(compact)) return null;

  const hasPlus = compact.startsWith("+");
  const digits = hasPlus ? compact.slice(1) : compact;

  let national: string;
  if (digits.length === 12 && digits.startsWith("375")) {
    national = digits.slice(3);
  } else if (hasPlus) {
    return null;
  } else if (digits.length === 11 && digits.startsWith("80")) {
    national = digits.slice(2);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return null;
  }

  if (!MOBILE_CODES.includes(national.slice(0, 2))) return null;
  return `+375${national}`;
}

/** `+375291234567` → `+375 29 123-45-67`; для мягкого форматирования на blur */
export function formatByPhone(normalized: string): string {
  const n = normalized.slice(4);
  return `+375 ${n.slice(0, 2)} ${n.slice(2, 5)}-${n.slice(5, 7)}-${n.slice(7)}`;
}

/** `+375291234567` → `+375 29 ***-**-67`; номер в логах – только так */
export function maskPhone(normalized: string): string {
  const n = normalized.slice(4);
  return `+375 ${n.slice(0, 2)} ***-**-${n.slice(7)}`;
}
