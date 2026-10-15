import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type LabelTone = "orange" | "gold" | "brown" | "ink" | "plain";

type LabelProps = HTMLAttributes<HTMLElement> & {
  tone?: LabelTone;
  /** Рамка 2 px ink, как у меток на этикетках */
  bordered?: boolean;
  as?: "span" | "p";
};

// Мелкий текст на orange и gold – только ink (контраст, design/tokens.md)
const tones: Record<LabelTone, string> = {
  orange: "bg-orange text-ink",
  gold: "bg-gold text-ink",
  brown: "bg-brown text-paper",
  ink: "bg-ink text-paper",
  plain: "",
};

// Моноширинная метка-плашка: «Обжарка по четвергам», «Светлая обжарка», «Обжарено чт»
export function Label({
  tone = "plain",
  bordered = false,
  as: Tag = "span",
  className,
  ...props
}: LabelProps) {
  return (
    <Tag
      className={cn(
        "type-label inline-block px-2.5 py-1.5",
        bordered && "border-2 border-ink",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
