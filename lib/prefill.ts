// Предзаполнение формы из CTA (ТЗ, раздел 4). CTA остаются серверными
// ссылками на #order с data-атрибутами, а форма ловит клики делегированием:
// без JS ссылка просто прокручивает к форме.
import { interestLabels, type Interest } from "@/lib/content";

export type Prefill = { interest: Interest; comment?: string };

export function isInterest(value: unknown): value is Interest {
  return typeof value === "string" && Object.hasOwn(interestLabels, value);
}

/** Атрибуты для `<a href="#order">` */
export function prefillAttrs({ interest, comment }: Prefill) {
  return {
    "data-interest": interest,
    ...(comment ? { "data-comment": comment } : {}),
  };
}

/** Предзаполнение из ближайшей ссылки-CTA, по которой кликнули */
export function readPrefill(target: EventTarget | null): Prefill | null {
  if (!(target instanceof Element)) return null;
  const link = target.closest<HTMLElement>("a[data-interest]");
  const interest = link?.dataset.interest;
  if (!link || !isInterest(interest)) return null;
  return { interest, comment: link.dataset.comment };
}

/**
 * Комментарий после клика по CTA. Текст человека не стираем: заменяем
 * только пустое поле или то, что подставил предыдущий CTA.
 */
export function nextComment(
  current: string,
  lastPrefilled: string,
  incoming: string | undefined,
): string {
  const untouched = current.trim() === "" || current === lastPrefilled;
  return untouched ? (incoming ?? "") : current;
}
