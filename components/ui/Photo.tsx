import Image from "next/image";
import type { Photo as PhotoData } from "@/lib/content";
import { cn } from "@/lib/cn";

type PhotoProps = {
  photo: PhotoData;
  /** Точные sizes под сетку секции – от них зависит вес фото */
  sizes: string;
  /** Класс aspect-ratio слота: держит место до загрузки, без сдвигов */
  aspect: string;
  /** Только для LCP-фото в hero; остальные грузятся lazy */
  preload?: boolean;
  className?: string;
};

// Слот фиксированных пропорций; рамку и тень задаёт секция через className
export function Photo({
  photo,
  sizes,
  aspect,
  preload = false,
  className,
}: PhotoProps) {
  return (
    <div className={cn("relative overflow-hidden", aspect, className)}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover"
      />
    </div>
  );
}
