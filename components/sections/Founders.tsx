import { Photo } from "@/components/ui/Photo";
import { founders } from "@/lib/content";

// Фото – 5/9 ширины с md: 627 px в контейнере 1280, иначе ~47vw
const PHOTO_SIZES =
  "(min-width: 1280px) 627px, (min-width: 768px) 47vw, calc(100vw - 40px)";

export function Founders() {
  return (
    <section
      id="founders"
      aria-labelledby="founders-title"
      className="container-page grid gap-9 py-12 md:grid-cols-[5fr_4fr] md:items-center md:gap-10 lg:gap-14 lg:py-22"
    >
      <div data-reveal>
        <Photo
          photo={founders.photo}
          sizes={PHOTO_SIZES}
          aspect="aspect-[4/3]"
          className="border-3 border-ink shadow-hard-lg"
        />
      </div>

      <div data-reveal>
        {/* На макете метка оранжевая, но мелкий оранжевый на бумаге – 3,1:1 (ТЗ, раздел 9) */}
        <p className="type-label text-brown">{founders.tag}</p>
        <h2 id="founders-title" className="type-h2 mt-5">
          {founders.title}
        </h2>
        <p className="mt-4 max-w-lg lg:mt-5">{founders.text}</p>
      </div>
    </section>
  );
}
