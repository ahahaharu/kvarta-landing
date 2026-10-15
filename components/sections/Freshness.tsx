import { Photo } from "@/components/ui/Photo";
import { ShortFull } from "@/components/ui/ShortFull";
import { freshness } from "@/lib/content";
import { cn } from "@/lib/cn";

// Три колонки с md: 380 px в контейнере 1280, иначе ~31vw
const PHOTO_SIZES =
  "(min-width: 1280px) 380px, (min-width: 768px) 31vw, calc(100vw - 40px)";

// Тёмная полоса. Оранжевый мелким текстом на ink – 4,95:1, проходит AA.
export function Freshness() {
  const lastIndex = freshness.steps.length - 1;

  return (
    <section
      id="freshness"
      aria-labelledby="freshness-title"
      className="bg-ink py-12 text-paper [--focus-ring:var(--color-paper)] lg:py-22"
    >
      <div className="container-page">
        <p className="type-label text-orange">{freshness.tag}</p>

        <div className="mt-5 grid gap-5 lg:mt-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-center lg:gap-16">
          <h2 id="freshness-title" className="type-h2">
            {freshness.title}
          </h2>
          <p className="type-body text-paper/80">
            <ShortFull text={freshness.text} />
          </p>
        </div>

        <ol className="mt-8 grid gap-5 md:grid-cols-3 md:gap-6 lg:mt-12">
          {freshness.steps.map((step, index) => {
            // Последний шаг – результат для клиента, выделен оранжевым
            const isLast = index === lastIndex;

            return (
              <li
                key={step.day}
                className={cn(
                  "border-2",
                  isLast
                    ? "border-orange bg-orange text-ink"
                    : "border-dashed border-paper",
                )}
              >
                <Photo
                  photo={step.photo}
                  sizes={PHOTO_SIZES}
                  aspect="aspect-[4/3]"
                />
                <div className="flex items-center gap-5 px-5 py-5 md:flex-col md:items-start md:gap-3 md:px-6 md:pt-6 md:pb-7">
                  <p
                    className={cn(
                      "type-label w-20 shrink-0 md:w-auto",
                      !isLast && "text-orange",
                    )}
                  >
                    {step.day}
                  </p>
                  <p className="font-display text-[1.625rem] leading-none font-bold tracking-[0.02em] uppercase lg:text-[2rem]">
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
