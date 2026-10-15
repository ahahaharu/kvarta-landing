import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "dark";
export type ButtonSize = "lg" | "md" | "sm";

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-orange text-ink",
  outline: "bg-paper text-ink",
  dark: "bg-ink text-white",
};

// lg – главная CTA (≥ 60 px), md – шапка и плашка, sm – «Заказать» в карточке сорта
const sizes: Record<ButtonSize, string> = {
  lg: "min-h-15 px-6 font-display text-[1.375rem] font-bold tracking-[0.04em] uppercase lg:text-2xl",
  md: "min-h-12 px-5 font-display text-lg font-bold tracking-[0.04em] uppercase",
  sm: "min-h-12 px-5 font-sans text-[0.9375rem] font-bold",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleProps = {}): string {
  return cn(
    "inline-flex items-center justify-center border-3 border-ink text-center leading-none",
    "motion-safe:transition-[translate,box-shadow] motion-safe:duration-150",
    "not-disabled:hover:-translate-0.5 not-disabled:hover:shadow-hard-sm not-disabled:active:translate-0 not-disabled:active:shadow-none",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonStyleProps & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}

// Для якорей на странице (#order); для переходов между страницами – buttonClasses() на next/link
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonStyleProps & ComponentProps<"a">) {
  return (
    <a className={buttonClasses({ variant, size, className })} {...props} />
  );
}
