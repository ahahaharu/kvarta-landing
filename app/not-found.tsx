import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/sections/Footer";
import { SubpageHeader } from "@/components/sections/SubpageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { notFound } from "@/lib/content";

export const metadata: Metadata = {
  title: notFound.title,
};

export default function NotFound() {
  return (
    <>
      <SubpageHeader />
      <main className="container-page pt-12 pb-20 lg:pt-20 lg:pb-28">
        <p
          aria-hidden="true"
          className="font-display text-[7.5rem] leading-none font-bold text-orange lg:text-[12rem]"
        >
          404
        </p>
        <h1 className="type-h2 mt-4">{notFound.title}</h1>
        <p className="type-lead mt-5 max-w-[34rem]">{notFound.text}</p>
        <Link
          href="/"
          className={buttonClasses({ size: "lg", className: "mt-8" })}
        >
          {notFound.cta}
        </Link>
      </main>
      <Footer withMobileBar={false} />
    </>
  );
}
