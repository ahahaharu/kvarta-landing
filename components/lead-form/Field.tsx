import type { ReactNode } from "react";

// Поле ввода: 18 px, рамка ink; ошибка – рамка orange (на белом 3,7:1 –
// достаточно для границы) и текст ink с оранжевой чертой. Фокус – глобальный
export const controlClasses =
  "block w-full border-2 border-ink bg-white px-4 text-lg text-ink placeholder:text-ink/55 aria-invalid:border-orange";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function fieldDescribedBy(
  id: string,
  { hint, error }: { hint?: string; error?: string },
): string | undefined {
  return (
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined
  );
}

export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.9375rem] font-bold">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-brown">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 border-l-4 border-orange pl-2 text-sm font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
}
