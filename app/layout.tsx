import type { Metadata } from "next";
import { JetBrains_Mono, Onest, Oswald } from "next/font/google";
import { seo } from "@/lib/content";
import { openGraphBase } from "@/lib/metadata";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// Метки и плашки – не в первом экране, preload не нужен
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  weight: "500",
  display: "swap",
  preload: false,
});

// OG-картинка и иконки – файлы рядом (opengraph-image.jpg, icon.svg, apple-icon.png,
// favicon.ico), Next сам ставит теги. Пересобрать: node scripts/brand-assets.mjs
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: seo.title, template: seo.titleTemplate },
  description: seo.description,
  alternates: { canonical: "/" },
  openGraph: {
    ...openGraphBase,
    title: seo.title,
    description: seo.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${oswald.variable} ${onest.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
