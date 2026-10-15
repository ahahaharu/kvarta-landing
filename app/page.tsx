import { ButtonLink, Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { coffee, formatPrice, hero, ORDER_HREF } from "@/lib/content";

// Заглушка до вёрстки секций (шаги 4–5): показывает токены и базовые компоненты
export default function Home() {
  const item = coffee.items[0];

  return (
    <main className="container-page flex min-h-svh flex-col justify-center gap-8 py-12 lg:py-22">
      <div className="flex flex-wrap gap-2">
        <Label tone="orange">{hero.tags[0].short}</Label>
        <Label>{hero.tags[1].short}</Label>
      </div>

      <h1 className="type-h1">
        {hero.title.before}{" "}
        <span className="text-orange">{hero.title.accent}</span>{" "}
        {hero.title.after}
      </h1>

      <p className="type-lead max-w-xl">{hero.lead.short}</p>

      <div className="flex flex-col gap-4 md:flex-row">
        <ButtonLink href={ORDER_HREF} size="lg">
          {hero.ctas[0].label}
        </ButtonLink>
        <ButtonLink href={ORDER_HREF} size="lg" variant="outline">
          {hero.ctas[1].label}
        </ButtonLink>
      </div>

      <Card
        as="article"
        shadow="lg"
        className="flex max-w-sm flex-col gap-4 p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="type-label">{item.number}</span>
          <Label tone="orange" bordered>
            {item.tag}
          </Label>
        </div>
        <h2 className="font-display text-[2rem] leading-none font-bold tracking-[0.02em] uppercase">
          {item.name}
        </h2>
        <p>{item.notes}</p>
        <div className="flex items-center justify-between gap-4 border-t-3 border-dashed border-ink pt-4">
          <span className="font-display text-[2.75rem] leading-none font-bold">
            {formatPrice(item.price)}
          </span>
          <Button variant="dark" size="sm">
            {coffee.orderLabel}
          </Button>
        </div>
      </Card>
    </main>
  );
}
