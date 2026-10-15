import { ButtonLink } from "@/components/ui/Button";
import { nav, ORDER_HREF } from "@/lib/content";

// На мобильной меню – <details> без JS. Он не закрывается по клику на якорь,
// поэтому шапка липкая только с lg, где якоря стоят в строку.
export function Header() {
  return (
    <header id="header" className="relative z-40 bg-paper lg:sticky lg:top-0">
      <a
        href={ORDER_HREF}
        className="sr-only bg-orange px-5 py-3 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {nav.skipLink}
      </a>

      <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-26">
        <a
          href="#hero"
          className="font-display text-[2rem] leading-none font-bold tracking-[0.04em] uppercase lg:text-[2.5rem]"
        >
          {nav.logo}
        </a>

        <nav aria-label={nav.ariaLabel} className="hidden lg:block">
          <ul className="flex gap-8">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-12 items-center text-[1.0625rem] font-medium underline-offset-6 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Обёртка: hidden на самой кнопке спорит с её inline-flex */}
        <div className="hidden lg:block">
          <ButtonLink href={ORDER_HREF} variant="dark" size="sm">
            {nav.cta}
          </ButtonLink>
        </div>

        <details className="group lg:hidden">
          <summary className="flex size-12 cursor-pointer list-none items-center justify-center border-3 border-ink [&::-webkit-details-marker]:hidden">
            <span className="sr-only">{nav.menuLabel}</span>
            <span aria-hidden="true" className="relative block h-3.5 w-5.5">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-ink group-open:translate-y-1.5 group-open:rotate-45" />
              <span className="absolute inset-x-0 top-1.5 h-0.5 bg-ink group-open:hidden" />
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink group-open:-translate-y-1.5 group-open:-rotate-45" />
            </span>
          </summary>

          <nav
            aria-label={nav.ariaLabel}
            className="absolute inset-x-0 top-16 border-b-3 border-ink bg-paper"
          >
            <ul className="container-page flex flex-col pt-2 pb-6">
              {nav.links.map((link) => (
                <li
                  key={link.href}
                  className="border-b-2 border-dashed border-ink"
                >
                  <a
                    href={link.href}
                    className="flex min-h-14 items-center font-display text-[1.75rem] leading-none font-bold tracking-[0.02em] uppercase"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-6">
                <ButtonLink href={ORDER_HREF} size="lg" className="w-full">
                  {nav.cta}
                </ButtonLink>
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
