import { ButtonLink } from "@/components/ui/Button";
import { Card, type CardTone } from "@/components/ui/Card";
import { Label, type LabelTone } from "@/components/ui/Label";
import { ShortFull } from "@/components/ui/ShortFull";
import { coffee, CURRENCY, ORDER_HREF } from "@/lib/content";
import { prefillAttrs } from "@/lib/prefill";

// Цвет метки и фон этикетки по порядку карточек, как в макете
const LABEL_STYLES: { tag: LabelTone; card: CardTone }[] = [
  { tag: "orange", card: "kraft" },
  { tag: "gold", card: "kraft" },
  { tag: "brown", card: "kraft" },
  { tag: "ink", card: "paper" },
];

export function Catalog() {
  return (
    <section
      id="coffee"
      aria-labelledby="coffee-title"
      className="container-page py-12 lg:py-22"
    >
      <div
        data-reveal
        className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8"
      >
        <h2 id="coffee-title" className="type-h2">
          {coffee.title}
        </h2>
        <p className="type-label lg:pb-1">{coffee.subtitle}</p>
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-2 md:gap-5 lg:mt-10 lg:grid-cols-4">
        {coffee.items.map((item, index) => {
          const style = LABEL_STYLES[index % LABEL_STYLES.length];

          return (
            <Card
              key={item.number}
              as="li"
              data-reveal
              tone={style.card}
              className="flex flex-col p-5 lg:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="hidden font-mono text-xs font-medium md:block">
                  {item.number}
                </span>
                <Label tone={style.tag} bordered className="px-2 py-1">
                  {item.tag}
                </Label>
              </div>

              <h3 className="mt-3 font-display text-[1.875rem] leading-none font-bold tracking-[0.02em] uppercase md:mt-6 lg:text-[2.5rem]">
                {item.name}
              </h3>
              <p className="mt-3 text-base leading-snug md:mb-6 lg:mt-4 lg:text-[1.0625rem]">
                {"notesShort" in item ? (
                  <ShortFull
                    text={{ full: item.notes, short: item.notesShort }}
                  />
                ) : (
                  item.notes
                )}
              </p>

              <div className="mt-3 flex items-center justify-between gap-4 border-t-2 border-dashed border-ink pt-3 md:mt-auto lg:pt-4">
                <p className="font-display leading-none font-bold uppercase">
                  <span className="text-[2.75rem] lg:text-5xl">
                    {item.price}
                  </span>
                  {" "}
                  <span className="ml-1.5 text-xl">{CURRENCY}</span>
                </p>
                <ButtonLink
                  href={ORDER_HREF}
                  {...prefillAttrs({
                    interest: "order",
                    comment: item.orderComment,
                  })}
                  variant="dark"
                  size="sm"
                  className="shrink-0"
                >
                  {coffee.orderLabel}
                  <span className="sr-only">: {item.name}</span>
                </ButtonLink>
              </div>
            </Card>
          );
        })}
      </ul>
    </section>
  );
}
