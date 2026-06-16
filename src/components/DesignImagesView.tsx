"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Expand } from "lucide-react";
import { parseDesignImages } from "@/lib/design-images";
import { ImagePreviewLightbox } from "@/components/ImagePreviewLightbox";

function isUnoptimizedSrc(src: string) {
  return (
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.endsWith(".svg")
  );
}

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
    <span className="pointer-events-none absolute bottom-2 left-2 z-[1] flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
      <Expand className="h-3 w-3" />
      {previewLabel}
    </span>
  );

  const tapClass =
    "block w-full overflow-hidden border-0 bg-zinc-100 p-0 text-left appearance-none ring-offset-2 transition hover:ring-2 hover:ring-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold";

  function ImageTile({ src, altText, sizes }: { src: string; altText: string; sizes: string }) {
    return (
      <span className="relative block h-full w-full">
        <Image
          src={src}
          alt={altText}
          fill
          className="object-cover"
          sizes={sizes}
          unoptimized={isUnoptimizedSrc(src)}
        />
      </span>
    );
  }

  if (layout === "grid") {
    return (
      <>
        <div className={`grid grid-cols-2 gap-2 ${className}`}>
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => openPreview(i)}
              className={`${tapClass} relative aspect-square rounded-xl`}
            >
              <ImageTile src={src} altText={`${alt} ${i + 1}`} sizes="(max-width: 640px) 50vw, 25vw" />
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
        className={`${tapClass} relative ${aspectClass}`}
      >
        <ImageTile src={cover} altText={alt} sizes="(max-width: 640px) 100vw, 33vw" />
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
          className={`${tapClass} relative ${aspectClass} ${className}`}
        >
          <ImageTile src={current} altText={alt} sizes="(max-width: 640px) 100vw, 33vw" />
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
          className={`${tapClass} relative ${aspectClass}`}
        >
          <ImageTile src={current} altText={alt} sizes="(max-width: 640px) 100vw, 33vw" />
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
              <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized={isUnoptimizedSrc(src)} />
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
