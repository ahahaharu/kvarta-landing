import { Founders } from "@/components/sections/Founders";
import { Freshness } from "@/components/sections/Freshness";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";

// Секции 05–08 (Кофе, Подписка, Заказ, Footer) – шаг 5
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Freshness />
        <Founders />
      </main>
    </>
  );
}
