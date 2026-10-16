// JSON-LD обжарки для поисковиков (ТЗ, раздел 11): адрес и часы – из content.ts.
import { business, photos, seo } from "@/lib/content";

export function coffeeShopJsonLd(site: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: business.name,
    description: seo.description,
    url: site.href,
    image: new URL(photos.hero.src, site).href,
    foundingDate: String(business.foundedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: business.street,
      addressLocality: business.city,
      addressCountry: "BY",
    },
    openingHoursSpecification: business.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs: [business.instagramUrl],
  };
}

/**
 * Строка для <script type="application/ld+json">. JSON.stringify не экранирует
 * «<», и «</script>» в данных закрыл бы тег – заменяем на <.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
