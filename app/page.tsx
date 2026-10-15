import { MobileBar } from "@/components/MobileBar";
import { Catalog } from "@/components/sections/Catalog";
import { Footer } from "@/components/sections/Footer";
import { Founders } from "@/components/sections/Founders";
import { Freshness } from "@/components/sections/Freshness";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Order } from "@/components/sections/Order";
import { Subscription } from "@/components/sections/Subscription";

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
    </>
  );
}
