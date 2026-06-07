"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { parseDesignImages } from "@/lib/design-images";

export function DesignImagesView({
  imagePath,
  imagesJson,
  alt,
  className = "",
  aspectClass = "aspect-[4/3]",
  layout = "carousel",
  detailHref,
  photosBadge,
}: {
  imagePath: string;
  imagesJson?: string | null;
  alt: string;
  className?: string;
  aspectClass?: string;
  layout?: "carousel" | "grid" | "cover";
  detailHref?: string;
  photosBadge?: string;
}) {
  const images = parseDesignImages(imagesJson, imagePath);
  const [active, setActive] = useState(0);

  if (layout === "grid") {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 25vw"
              unoptimized={src.endsWith(".svg")}
            />
          </div>
        ))}
      </div>
    );
  }

  if (layout === "cover") {
    const cover = images[0] ?? imagePath;
    const inner = (
      <div className={`relative ${aspectClass} bg-zinc-100`}>
        <Image
          src={cover}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
          unoptimized={cover.endsWith(".svg")}
        />
        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-brand-green/90 px-2.5 py-1 text-xs font-bold text-brand-gold">
            {photosBadge ?? `${images.length} photos`}
          </span>
        )}
      </div>
    );
    if (detailHref) {
      return (
        <Link href={detailHref} className={`block ${className}`}>
          {inner}
        </Link>
      );
    }
    return <div className={className}>{inner}</div>;
  }

  const current = images[active] ?? imagePath;

  if (images.length <= 1) {
    return (
      <div className={`relative ${aspectClass} bg-zinc-100 ${className}`}>
        <Image
          src={current}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
          unoptimized={current.endsWith(".svg")}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`relative ${aspectClass} bg-zinc-100`}>
        <Image
          src={current}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
          unoptimized={current.endsWith(".svg")}
        />
        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-bold text-white">
          {active + 1}/{images.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 bg-zinc-50 p-1 sm:grid-cols-4">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className={`relative aspect-square overflow-hidden rounded-md border-2 ${
              i === active ? "border-brand-gold" : "border-transparent"
            }`}
          >
            <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized />
          </button>
        ))}
      </div>
    </div>
  );
}
