import { MobileBar } from "@/components/MobileBar";
import { Catalog } from "@/components/sections/Catalog";
import { Footer } from "@/components/sections/Footer";
import { Founders } from "@/components/sections/Founders";
import { Freshness } from "@/components/sections/Freshness";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Order } from "@/components/sections/Order";
import { Reveal } from "@/components/Reveal";
import { Subscription } from "@/components/sections/Subscription";
import { coffeeShopJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Freshness />
        <Founders />
        <Catalog />
        <Subscription />
        <Order />
      </main>
      <Footer />
      <MobileBar />
      <Reveal />
      <script
        type="application/ld+json"
        // Данные только из content.ts, «<» экранирован в serializeJsonLd
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(coffeeShopJsonLd(siteUrl())),
        }}
      />
    </>
  );
}
