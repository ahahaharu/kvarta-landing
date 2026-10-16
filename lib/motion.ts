// То же условие, что у motion-safe в CSS: анимации из JS проверяют его сами
export function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
