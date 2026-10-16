"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { LEAD_FORM_ID, mobileBar, ORDER_HREF } from "@/lib/content";
import { prefillAttrs } from "@/lib/prefill";

// Нижняя плашка < md: появляется, когда hero ушёл вверх за экран,
// и прячется, пока форма заявки в зоне видимости (ТЗ, раздел 4).
export function MobileBar() {
  const [heroPassed, setHeroPassed] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const form = document.getElementById(LEAD_FORM_ID);
    if (!hero || !form) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) {
          setHeroPassed(
            !entry.isIntersecting && entry.boundingClientRect.top < 0,
          );
        } else {
          setFormVisible(entry.isIntersecting);
        }
      }
    });
    observer.observe(hero);
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  const visible = heroPassed && !formVisible;

  // Скрытая плашка – invisible + inert: не ловит фокус и не читается
  return (
    <div
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 bg-ink pb-[env(safe-area-inset-bottom)] text-paper [--focus-ring:var(--color-paper)] md:hidden",
        "motion-safe:transition-[translate,visibility] motion-safe:duration-250",
        !visible && "invisible translate-y-full",
      )}
    >
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <p className="flex flex-col gap-1.5">
          <span className="type-label text-paper/70">{mobileBar.tag}</span>
          <span className="font-display text-2xl leading-none font-bold tracking-[0.02em] uppercase">
            {mobileBar.price}
          </span>
        </p>
        <ButtonLink href={ORDER_HREF} size="lg" {...prefillAttrs(mobileBar)}>
          {mobileBar.cta}
        </ButtonLink>
      </div>
    </div>
  );
}
