// Общая часть Open Graph. Next сливает metadata поверхностно: страница со своим
// openGraph теряет поля layout, а заодно и картинку app/opengraph-image.jpg.
import type { Metadata } from "next";
import { business, seo } from "@/lib/content";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

export const openGraphBase = {
  type: "website",
  locale: "ru_RU",
  siteName: business.name,
} satisfies OpenGraph;

/** Для внутренних страниц: на главной картинку с хешем в адресе ставит сам Next */
export const ogImage = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: seo.ogAlt,
};
