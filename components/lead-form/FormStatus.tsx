import { useEffect, useRef } from "react";
import { order } from "@/lib/content";

const { status } = order.form;

export type FormErrorReason = "network" | "server" | "rate_limited";

const errorTexts: Record<FormErrorReason, string> = {
  network: status.network,
  server: status.server,
  rate_limited: status.rateLimited,
};

// Ошибка отправки над кнопкой. Instagram – запасной канал, когда виноваты мы
export function FormError({ reason }: { reason: FormErrorReason }) {
  return (
    <div role="alert" className="border-l-4 border-orange bg-paper p-4 text-sm">
      <p className="font-medium">{errorTexts[reason]}</p>
      {reason !== "network" && (
        <a
          href={status.instagram.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-12 items-center font-bold underline decoration-2 underline-offset-4 hover:decoration-orange"
        >
          {status.instagram.label}
        </a>
      )}
    </div>
  );
}

type FormSuccessProps = {
  name: string;
  phone: string;
  duplicate: boolean;
  callback: string | null;
};

// Карточка вместо формы: фокус на заголовок, чтобы скринридер прочитал итог
export function FormSuccess({
  name,
  phone,
  duplicate,
  callback,
}: FormSuccessProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div role="status" aria-live="polite">
      <h3
        ref={titleRef}
        tabIndex={-1}
        className="font-display text-[2rem] leading-none font-bold tracking-[0.02em] uppercase lg:text-[2.5rem]"
      >
        {status.successTitle(name)}
      </h3>
      <p className="mt-4 text-lg">
        {duplicate ? status.duplicate : status.successText(phone)}
      </p>
      {callback && (
        <p className="mt-4 border-t-2 border-dashed border-ink pt-4 font-bold">
          {callback}
        </p>
      )}
    </div>
  );
}
