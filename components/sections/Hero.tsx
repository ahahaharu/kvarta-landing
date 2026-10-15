import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Photo } from "@/components/ui/Photo";
import { ShortFull } from "@/components/ui/ShortFull";
import { cn } from "@/lib/cn";
import { hero, ORDER_HREF } from "@/lib/content";

// Две колонки с lg: фото 460 px в контейнере 1280, иначе ~35vw; на md – до 448 px
const PHOTO_SIZES =
  "(min-width: 1280px) 460px, (min-width: 1024px) 35vw, (min-width: 768px) 448px, calc(100vw - 40px)";

export function Hero() {
  const [primary, secondary] = hero.ctas;
  const { sticker } = hero;

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="container-page grid gap-12 pt-5 pb-12 md:pt-10 md:pb-20 lg:grid-cols-[1.4fr_1fr] lg:gap-20 lg:pb-22"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Label tone="orange">
            <ShortFull text={hero.tags[0]} />
          </Label>
          <Label>
            <ShortFull text={hero.tags[1]} />
          </Label>
        </div>

        <h1 id="hero-title" className="type-h1 mt-5 lg:mt-8">
          {hero.title.before}{" "}
          <span className="text-orange">{hero.title.accent}</span>{" "}
          {hero.title.after}
        </h1>

        <p className="type-lead mt-5 max-w-[34rem] lg:mt-6">
          <ShortFull text={hero.lead} />
        </p>

        <div className="mt-7 flex flex-col gap-4 md:flex-row md:flex-wrap lg:mt-8">
          <ButtonLink href={ORDER_HREF} size="lg">
            {primary.label}
          </ButtonLink>
          <ButtonLink href={ORDER_HREF} size="lg" variant="outline">
            {secondary.label}
          </ButtonLink>
        </div>

        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t-3 border-ink pt-5 text-[0.9375rem] lg:mt-8 lg:pt-6">
          {hero.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>

      <div className="relative w-full self-start md:max-w-md md:justify-self-center lg:mt-11 lg:max-w-none">
        <Photo
          photo={hero.photo}
          sizes={PHOTO_SIZES}
          aspect="aspect-[3/4]"
          preload
          className="border-3 border-ink shadow-hard-lg"
        />

        {/* Наклейка дублирует карточку сорта – для скринридера это шум */}
        <Card
          tone="paper"
          shadow="sm"
          aria-hidden="true"
          className="absolute -bottom-5 -left-3 w-56 -rotate-2 p-3.5 md:-bottom-9 md:-left-8 md:w-64 md:p-5"
        >
          <div className="type-label flex justify-between gap-3">
            <span>{sticker.brand}</span>
            <span>{sticker.weight}</span>
          </div>
          <p className="mt-2.5 font-display text-2xl leading-none font-bold tracking-[0.02em] uppercase md:mt-4 md:text-[1.875rem]">
            {sticker.name}
          </p>
          <p className="mt-2 hidden text-[0.9375rem] leading-tight md:block">
            {sticker.notes}
          </p>
          <ul className="mt-2.5 flex gap-1.5 font-mono text-[0.625rem] leading-none font-medium tracking-[0.08em] whitespace-nowrap uppercase md:mt-3">
            {sticker.tags.map((tag, index) => (
              <li
                key={tag}
                className={cn(
                  "border-2 border-ink px-1.5 py-1",
                  index === 0 && "bg-orange",
                )}
              >
                {tag}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
