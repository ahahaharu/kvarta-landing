import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardTone = "kraft" | "paper" | "white";
export type CardShadow = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLElement> & {
  tone?: CardTone;
  shadow?: CardShadow;
  as?: "div" | "article" | "li";
};

const tones: Record<CardTone, string> = {
  kraft: "bg-kraft",
  paper: "bg-paper",
  white: "bg-white",
};

const shadows: Record<CardShadow, string> = {
  none: "",
  sm: "shadow-hard-sm",
  md: "shadow-hard-md",
  lg: "shadow-hard-lg",
};

// Рамка 3 px ink, прямые углы, жёсткая тень. Отступы внутри задаёт секция.
export function Card({
  tone = "kraft",
  shadow = "none",
  as: Tag = "div",
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        "border-3 border-ink",
        tones[tone],
        shadows[shadow],
        className,
      )}
      {...props}
    />
  );
}
