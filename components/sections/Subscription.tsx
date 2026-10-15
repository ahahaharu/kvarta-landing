import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { ShortFull } from "@/components/ui/ShortFull";
import { ORDER_HREF, subscription } from "@/lib/content";

// С lg фото в колонке фиксированной ширины 504 px
const PHOTO_SIZES = "(min-width: 1024px) 504px, calc(100vw - 40px)";

// Оранжевая полоса: весь мелкий текст – ink (белый на orange только крупным)
export function Subscription() {
  return (
    <section
      id="subscription"
      aria-labelledby="subscription-title"
      className="bg-orange py-12 text-ink lg:py-22"
    >
      <div className="container-page grid gap-x-14 lg:grid-cols-[1fr_minmax(0,31.5rem)] lg:grid-rows-[auto_1fr]">
        <div className="lg:self-end">
          <p className="type-label">{subscription.tag}</p>
          <h2 id="subscription-title" className="type-h2 mt-5 lg:mt-7">
            {subscription.title}
          </h2>
        </div>

        <div className="relative mt-6 mr-2 mb-16 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:my-0 lg:mr-0 lg:self-center">
          <Photo
            photo={subscription.photo}
            sizes={PHOTO_SIZES}
            aspect="aspect-[4/3]"
            className="border-3 border-ink"
          />

          <Card
            tone="paper"
            shadow="md"
            className="absolute -right-2 -bottom-10 px-4 py-3 lg:-right-4 lg:px-6 lg:py-4"
          >
            <p className="font-display leading-none font-bold uppercase">
              <span className="text-5xl lg:text-[3.5rem]">
                {subscription.price}
              </span>
              {"\u00A0"}
              <span className="ml-1.5 text-xl lg:text-2xl">
                {subscription.priceUnit}
              </span>
            </p>
            <p className="mt-1.5 text-sm">{subscription.priceNote}</p>
          </Card>
        </div>

        <div className="lg:mt-6">
          <p className="max-w-lg">
            <ShortFull text={subscription.text} />
          </p>
          <ButtonLink
            href={ORDER_HREF}
            variant="dark"
            size="lg"
            className="mt-6 w-full lg:mt-8 lg:w-auto"
          >
            {subscription.cta.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
