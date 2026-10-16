// Проверка полей формы и черновик в sessionStorage (ТЗ, раздел 5).
// Без React и zod: модуль попадает в клиентский бандл.
import { order } from "@/lib/content";
import { isValidComment, isValidName, normalizeByPhone } from "./rules";

const errors = order.form.errors;

// Порядок – порядок полей в форме: фокус уходит на первое неверное
export const FORM_FIELDS = ["name", "phone", "comment"] as const;

export type FormField = (typeof FORM_FIELDS)[number];

export type FormErrors = Partial<Record<FormField, string>>;

export function isFormField(value: string): value is FormField {
  return FORM_FIELDS.includes(value as FormField);
}

export function validateField(field: FormField, value: string): string | null {
  switch (field) {
    case "name":
      return isValidName(value) ? null : errors.name;
    case "phone":
      return normalizeByPhone(value) ? null : errors.phone;
    case "comment":
      return isValidComment(value) ? null : errors.comment;
  }
}

export function validateForm(values: Record<FormField, string>): FormErrors {
  const result: FormErrors = {};
  for (const field of FORM_FIELDS) {
    const error = validateField(field, values[field]);
    if (error) result[field] = error;
  }
  return result;
}

// Имя и телефон переживают случайную перезагрузку страницы
export const DRAFT_STORAGE_KEY = "kvarta:lead-draft";

export type Draft = { name: string; phone: string };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadDraft(storage: StorageLike | null): Draft | null {
  try {
    const raw = storage?.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Record<keyof Draft, unknown>>;
    return {
      name: typeof data.name === "string" ? data.name : "",
      phone: typeof data.phone === "string" ? data.phone : "",
    };
  } catch {
    return null;
  }
}

export function saveDraft(storage: StorageLike | null, draft: Draft): void {
  try {
    if (draft.name || draft.phone) {
      storage?.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } else {
      storage?.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {
    // Хранилище недоступно – форма работает и без черновика
  }
}

export function clearDraft(storage: StorageLike | null): void {
  try {
    storage?.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // см. saveDraft
  }
}

/** localStorage / sessionStorage или `null`: само обращение может бросить */
export function getStorage(
  kind: "localStorage" | "sessionStorage",
): Storage | null {
  try {
    return window[kind];
  } catch {
    return null;
  }
}
