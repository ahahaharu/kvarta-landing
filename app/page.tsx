// Заглушка до вёрстки секций (шаги 4–5)
export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-xs font-medium tracking-[0.08em] uppercase">
        Минск
      </p>
      <h1 className="font-display text-6xl font-bold tracking-[0.04em] uppercase">
        Кварта
      </h1>
      <p className="text-base">Обжарка кофе. Сайт скоро будет.</p>
    </main>
  );
}
