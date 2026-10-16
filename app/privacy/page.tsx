import type { Metadata } from "next";
import { Footer } from "@/components/sections/Footer";
import { SubpageHeader } from "@/components/sections/SubpageHeader";
import { privacy } from "@/lib/content";
import { ogImage, openGraphBase } from "@/lib/metadata";

const PATH = "/privacy";

export const metadata: Metadata = {
  title: privacy.title,
  description: privacy.description,
  alternates: { canonical: PATH },
  openGraph: {
    ...openGraphBase,
    title: privacy.title,
    description: privacy.description,
    url: PATH,
    images: ogImage,
  },
};

const H2 =
  "font-display text-[1.75rem] leading-none font-bold tracking-[0.02em] uppercase lg:text-[2rem]";

export default function PrivacyPage() {
  const { contact } = privacy;

  return (
    <>
      <SubpageHeader />
      <main className="container-page pt-10 pb-16 lg:pt-16 lg:pb-24">
        <article className="max-w-[46rem]">
          <h1 className="type-h2">{privacy.title}</h1>
          <p className="type-label mt-5 text-brown">{privacy.updated}</p>
          <p className="type-lead mt-6">{privacy.intro}</p>

          {privacy.sections.map((section) => (
            <section
              key={section.title}
              className="mt-10 border-t-2 border-dashed border-ink pt-6"
            >
              <h2 className={H2}>{section.title}</h2>
              {"text" in section &&
                section.text.map((paragraph) => (
                  <p key={paragraph} className="mt-4">
                    {paragraph}
                  </p>
                ))}
              {"list" in section && (
                <ul className="mt-4 flex list-disc flex-col gap-2 pl-6 marker:text-orange">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="mt-10 border-3 border-ink bg-white p-5 shadow-hard-md md:p-8">
            <h2 className={H2}>{contact.title}</h2>
            <p className="mt-4">{contact.text}</p>
            <a
              href={contact.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-12 items-center font-bold underline underline-offset-4"
            >
              {contact.link.label}
            </a>
          </section>
        </article>
      </main>
      <Footer withMobileBar={false} />
    </>
  );
}
