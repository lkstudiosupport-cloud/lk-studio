"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Expand } from "lucide-react";
import { parseDesignImages } from "@/lib/design-images";
import { ImagePreviewLightbox } from "@/components/ImagePreviewLightbox";

export function DesignImagesView({
  imagePath,
  imagesJson,
  alt,
  className = "",
  aspectClass = "aspect-[4/3]",
  layout = "carousel",
  detailHref,
  photosBadge,
  previewCloseLabel = "Close",
  previewLabel = "Preview",
}: {
  imagePath: string;
  imagesJson?: string | null;
  alt: string;
  className?: string;
  aspectClass?: string;
  layout?: "carousel" | "grid" | "cover";
  detailHref?: string;
  photosBadge?: string;
  previewCloseLabel?: string;
  previewLabel?: string;
}) {
  const images = parseDesignImages(imagesJson, imagePath);
  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  function openPreview(index: number) {
    setPreviewIndex(index);
    setPreviewOpen(true);
  }

  const previewBtn = (
    <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
      <Expand className="h-3 w-3" />
      {previewLabel}
    </span>
  );

  if (layout === "grid") {
    return (
      <>
        <div className={`grid grid-cols-2 gap-2 ${className}`}>
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => openPreview(i)}
              className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 ring-offset-2 transition hover:ring-2 hover:ring-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
                unoptimized={src.endsWith(".svg")}
              />
              {previewBtn}
            </button>
          ))}
        </div>
        <ImagePreviewLightbox
          images={images}
          startIndex={previewIndex}
          alt={alt}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          closeLabel={previewCloseLabel}
        />
      </>
    );
  }

  if (layout === "cover") {
    const cover = images[0] ?? imagePath;
    const inner = (
      <button
        type="button"
        onClick={() => openPreview(0)}
        className={`relative block w-full ${aspectClass} bg-zinc-100 ring-offset-2 transition hover:ring-2 hover:ring-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold`}
      >
        <Image
          src={cover}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
          unoptimized={cover.endsWith(".svg")}
        />
        {previewBtn}
        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-brand-green/90 px-2.5 py-1 text-xs font-bold text-brand-gold">
            {photosBadge ?? `${images.length} photos`}
          </span>
        )}
      </button>
    );

    return (
      <>
        <div className={className}>
          {inner}
          {detailHref && (
            <Link
              href={detailHref}
              className="mt-1 block text-center text-xs font-semibold text-brand-green underline"
            >
              {photosBadge ?? "View all photos"}
            </Link>
          )}
        </div>
        <ImagePreviewLightbox
          images={images}
          startIndex={previewIndex}
          alt={alt}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          closeLabel={previewCloseLabel}
        />
      </>
    );
  }

  const current = images[active] ?? imagePath;

  if (images.length <= 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => openPreview(0)}
          className={`relative block w-full ${aspectClass} bg-zinc-100 ring-offset-2 transition hover:ring-2 hover:ring-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold ${className}`}
        >
          <Image
            src={current}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
            unoptimized={current.endsWith(".svg")}
          />
          {previewBtn}
        </button>
        <ImagePreviewLightbox
          images={images.length ? images : [imagePath]}
          startIndex={0}
          alt={alt}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          closeLabel={previewCloseLabel}
        />
      </>
    );
  }

  return (
    <>
      <div className={className}>
        <button
          type="button"
          onClick={() => openPreview(active)}
          className={`relative block w-full ${aspectClass} bg-zinc-100 ring-offset-2 transition hover:ring-2 hover:ring-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold`}
        >
          <Image
            src={current}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
            unoptimized={current.endsWith(".svg")}
          />
          {previewBtn}
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-bold text-white">
            {active + 1}/{images.length}
          </span>
        </button>
        <div className="grid grid-cols-3 gap-1 bg-zinc-50 p-1 sm:grid-cols-4">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              onDoubleClick={() => openPreview(i)}
              className={`relative aspect-square overflow-hidden rounded-md border-2 ${
                i === active ? "border-brand-gold" : "border-transparent"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized />
            </button>
          ))}
        </div>
      </div>
      <ImagePreviewLightbox
        images={images}
        startIndex={previewIndex}
        alt={alt}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        closeLabel={previewCloseLabel}
      />
    </>
  );
}
