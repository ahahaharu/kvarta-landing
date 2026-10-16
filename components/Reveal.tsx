"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// Ступенька между блоками, которые вошли в экран одновременно. При быстрой
// прокрутке их может быть много – дольше 300 мс никто не ждёт
const STEP_MS = 60;
const MAX_STEPS = 5;

// Появление блоков [data-reveal] при прокрутке (ТЗ, раздел 11): один
// IntersectionObserver на страницу, сама анимация – в globals.css.
// Прячем только отсюда и только то, что ниже первого экрана: без JS
// контент виден, а видимое при загрузке не мигает
export function Reveal() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const nodes = [
      ...document.querySelectorAll<HTMLElement>("[data-reveal]"),
    ].filter((node) => node.getBoundingClientRect().top >= window.innerHeight);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entered = entries.filter((entry) => entry.isIntersecting);
        entered.forEach(({ target }, index) => {
          const node = target as HTMLElement;
          node.style.animationDelay = `${Math.min(index, MAX_STEPS) * STEP_MS}ms`;
          node.dataset.reveal = "shown";
          observer.unobserve(node);
        });
      },
      // Блок начинает появляться, когда поднялся над нижними 10 % экрана
      { rootMargin: "0px 0px -10% 0px" },
    );

    for (const node of nodes) {
      node.dataset.reveal = "pending";
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  return null;
}
