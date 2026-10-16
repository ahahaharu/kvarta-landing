import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { nav, subpage } from "@/lib/content";

// Шапка /privacy и 404: якоря главной здесь не нужны – только путь назад
export function SubpageHeader() {
  return (
    <header id="header" className="border-b-3 border-ink bg-paper">
      <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-26">
        <Link
          href="/"
          className="font-display text-[2rem] leading-none font-bold tracking-[0.04em] uppercase lg:text-[2.5rem]"
        >
          {nav.logo}
        </Link>
        <Link
          href="/"
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          {subpage.home}
        </Link>
      </div>
    </header>
  );
}
