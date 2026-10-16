import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { ShortFull } from "@/components/ui/ShortFull";
import { LEAD_FORM_ID, order } from "@/lib/content";

// Левая колонка с lg: 538 px в контейнере 1280, иначе ~43vw
const PHOTO_SIZES =
  "(min-width: 1280px) 538px, (min-width: 1024px) 43vw, calc(100vw - 40px)";

export function Order() {
  return (
    <section
      id="order"
      aria-labelledby="order-title"
      className="container-page grid gap-x-14 py-12 lg:grid-cols-[5fr_6fr] lg:grid-rows-[auto_1fr] lg:py-22"
    >
      <h2 id="order-title" className="type-h2 lg:pt-1">
        {order.title}
      </h2>

      {/* Форма заявки – шаг 8 (LeadForm). Пока только каркас карточки. */}
      <Card
        id={LEAD_FORM_ID}
        tone="white"
        shadow="lg"
        className="mt-6 mr-2.5 p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:mr-3 lg:self-start lg:p-9"
      >
        <p className="text-sm text-brown">
          <ShortFull text={order.form.note} />
        </p>
      </Card>

      <div className="mt-8 lg:mt-9">
        <Photo
          photo={order.photo}
          sizes={PHOTO_SIZES}
          aspect="aspect-[4/3]"
          className="border-3 border-ink"
        />

        <dl className="mt-6 lg:mt-8">
          {order.info.map((item) => (
            <div
              key={item.title}
              className="border-t-3 border-ink pt-3 pb-5 lg:pt-5 lg:pb-6 [&>dt+dd]:mt-1.5"
            >
              <dt className="type-label">{item.title}</dt>
              {item.lines.map((line) => (
                <dd key={line}>
                  {"href" in item ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-2 underline-offset-4 hover:decoration-orange"
                    >
                      {line}
                    </a>
                  ) : (
                    line
                  )}
                </dd>
              ))}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
