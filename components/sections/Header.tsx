import type { CSSProperties } from "react";
import { MobileMenu } from "@/components/MobileMenu";
import { ButtonLink } from "@/components/ui/Button";
import { business, nav, ORDER_HREF } from "@/lib/content";

// Шапка липкая на всех ширинах. До lg меню – <details> (закрывает его MobileMenu):
// карточка выпадает из-под шапки, страница под ней затемняется – меню не сливается
// с бумажной страницей и её кнопками. Анимации – в globals.css

export function Header() {
  return (
    <header id="header" className="sticky top-0 z-40 bg-paper">
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

        <MobileMenu className="lg:hidden">
          <summary className="flex size-12 cursor-pointer list-none items-center justify-center border-3 border-ink [&::-webkit-details-marker]:hidden">
            <span className="sr-only">{nav.menuLabel}</span>
            {/* Бургер и крестик – в globals.css, [data-burger] */}
            <span
              data-burger
              aria-hidden="true"
              className="relative block h-3.5 w-5.5 *:absolute *:inset-x-0 *:h-0.5 *:bg-ink"
            >
              <span className="top-0" />
              <span className="top-1.5" />
              <span className="bottom-0" />
            </span>
          </summary>

          {/* Затемнение страницы под карточкой, клик по нему закрывает меню */}
          <div
            data-menu-scrim
            aria-hidden="true"
            className="fixed inset-x-0 top-16 bottom-0 bg-ink/40"
          />

          {/* Карточка-этикетка, как у сортов: kraft, рамка ink, жёсткая тень */}
          <nav
            data-menu-panel
            aria-label={nav.ariaLabel}
            className="fixed inset-x-5 top-19 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain border-3 border-ink bg-kraft shadow-hard-lg md:left-auto md:right-12 md:w-96"
          >
            <ul className="px-4 pt-1">
              {nav.links.map((link, index) => (
                <li
                  key={link.href}
                  style={{ "--i": index } as CSSProperties}
                  className="border-b-2 border-dashed border-ink"
                >
                  <a
                    href={link.href}
                    className="flex min-h-15 items-center gap-3 font-display text-[1.375rem] leading-none font-bold tracking-[0.02em] uppercase"
                  >
                    <span
                      aria-hidden="true"
                      className="type-label shrink-0 text-brown"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="p-4 pt-5">
              <ButtonLink href={ORDER_HREF} size="lg" className="w-full">
                {nav.cta}
              </ButtonLink>
            </div>

            <div className="type-label flex flex-col gap-1.5 border-t-2 border-dashed border-ink px-4 py-4 text-brown">
              <p>{business.address}</p>
              {business.hours.map((h) => (
                <p key={h.label}>{h.label}</p>
              ))}
            </div>
          </nav>
        </MobileMenu>
      </div>
    </header>
  );
}
