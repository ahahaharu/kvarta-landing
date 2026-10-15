import { business, footer } from "@/lib/content";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;
// py-1 – цель касания не меньше 24 px
const LINK = "py-1 underline-offset-4 hover:underline";

// На мобильной снизу запас под плашку MobileBar с учётом safe-area
export function Footer() {
  return (
    <footer
      id="footer"
      className="bg-ink pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] text-paper [--focus-ring:var(--color-paper)] md:pb-10 lg:py-9"
    >
      <div className="container-page">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-8">
          <p className="font-display text-[1.75rem] leading-none font-bold tracking-[0.04em] uppercase">
            {footer.logo}
          </p>
          <p className="mt-2 text-base md:mt-0">
            <a href={business.mapUrl} className={LINK} {...EXTERNAL}>
              {footer.address}
            </a>{" "}
            · {footer.since}
          </p>
          <a
            href={footer.instagram.href}
            className="self-start py-1 text-base underline underline-offset-4 md:self-auto"
            {...EXTERNAL}
          >
            {footer.instagram.label}
          </a>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t-2 border-dashed border-paper/40 pt-5 text-sm text-paper/70 md:flex-row md:justify-between md:gap-8 lg:mt-7">
          <a href={footer.privacy.href} className={`self-start ${LINK}`}>
            {footer.privacy.label}
          </a>
          <p>{footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
