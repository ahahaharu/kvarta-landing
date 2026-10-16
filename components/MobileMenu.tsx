"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// Мобильное меню – <details>: без JS оно открывается и закрывается само.
// JS добавляет то, чего <details> не умеет: закрыть меню по клику на пункт
// (шапка липкая – иначе меню так и висит поверх раздела), по затемнению
// и по Esc, и проиграть анимацию закрытия: пока она идёт, стоит data-closing
export function MobileMenu({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const summary = details.querySelector("summary");
    const panel = details.querySelector<HTMLElement>("[data-menu-panel]");

    const close = () => {
      if (!details.open || "closing" in details.dataset) return;
      if (!panel || prefersReducedMotion()) {
        details.open = false;
        return;
      }
      details.dataset.closing = "";
      // getAnimations() пересчитывает стили, анимация закрытия уже в списке.
      // Нет анимации (печать, стили не загрузились) – закрываем сразу
      Promise.allSettled(panel.getAnimations().map((a) => a.finished)).then(
        () => {
          delete details.dataset.closing;
          details.open = false;
        },
      );
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest("summary")) {
        // Открывает <details> сам, закрываем мы – с анимацией
        if (details.open) {
          event.preventDefault();
          close();
        }
        return;
      }
      if (target.closest("a, [data-menu-scrim]")) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !details.open) return;
      close();
      summary?.focus();
    };

    details.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      details.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      {children}
    </details>
  );
}
