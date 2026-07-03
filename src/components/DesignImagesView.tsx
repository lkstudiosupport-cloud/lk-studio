"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Expand } from "lucide-react";
import { parseDesignImageSrcs } from "@/lib/design-images";
import { ImagePreviewLightbox } from "@/components/ImagePreviewLightbox";

const FALLBACK_DESIGN_IMAGE = "/placeholder-design.svg";

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
  onOpenPreview,
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
  /** When set, full-view opens catalog lightbox (browse designs) instead of per-card lightbox. */
  onOpenPreview?: (photoIndex: number) => void;
}) {
  const imageSrcs = parseDesignImageSrcs(imagesJson, imagePath);
  const fullImages = imageSrcs.map((s) => s.full);
  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  function openPreview(index: number) {
    if (onOpenPreview) {
      onOpenPreview(index);
      return;
    }
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

  function ImageTile({
    displaySrc,
    fullSrc,
    altText,
    sizes,
  }: {
    displaySrc: string;
    fullSrc: string;
    altText: string;
    sizes: string;
  }) {
    const [imgSrc, setImgSrc] = useState(displaySrc);
    useEffect(() => {
      setImgSrc(displaySrc);
    }, [displaySrc]);

    return (
      <span className="relative block h-full w-full bg-zinc-200">
        <Image
          src={imgSrc}
          alt={altText}
          fill
          loading="lazy"
          className="object-cover"
          sizes={sizes}
          unoptimized={isUnoptimizedSrc(imgSrc)}
          onError={() => {
            if (imgSrc !== fullSrc) setImgSrc(fullSrc);
            else if (imgSrc !== FALLBACK_DESIGN_IMAGE) setImgSrc(FALLBACK_DESIGN_IMAGE);
          }}
        />
      </span>
    );
  }

  function srcForIndex(i: number) {
    const entry = imageSrcs[i];
    if (entry) return entry;
    const full = fullImages[i] ?? imagePath;
    return { display: full, full };
  }

  if (layout === "grid") {
    return (
      <>
        <div className={`grid grid-cols-2 gap-2 ${className}`}>
          {fullImages.map((_, i) => {
            const { display, full } = srcForIndex(i);
            return (
              <button
                key={`${full}-${i}`}
                type="button"
                onClick={() => openPreview(i)}
                className={`${tapClass} relative aspect-square rounded-xl`}
              >
                <ImageTile
                  displaySrc={display}
                  fullSrc={full}
                  altText={`${alt} ${i + 1}`}
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {previewBtn}
              </button>
            );
          })}
        </div>
        {!onOpenPreview && (
          <ImagePreviewLightbox
            images={fullImages}
            startIndex={previewIndex}
            alt={alt}
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            closeLabel={previewCloseLabel}
          />
        )}
      </>
    );
  }

  if (layout === "cover") {
    const { display, full } = srcForIndex(0);
    const inner = (
      <button
        type="button"
        onClick={() => openPreview(0)}
        className={`${tapClass} relative ${aspectClass}`}
      >
        <ImageTile
          displaySrc={display}
          fullSrc={full}
          altText={alt}
          sizes="(max-width: 640px) 100vw, 33vw"
        />
        {previewBtn}
        {fullImages.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-brand-green/90 px-2.5 py-1 text-xs font-bold text-brand-gold">
            {photosBadge ?? `${fullImages.length} photos`}
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
        {!onOpenPreview && (
          <ImagePreviewLightbox
            images={fullImages}
            startIndex={previewIndex}
            alt={alt}
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            closeLabel={previewCloseLabel}
          />
        )}
      </>
    );
  }

  const current = srcForIndex(active);

  if (fullImages.length <= 1) {
    const single = srcForIndex(0);
    return (
      <>
        <button
          type="button"
          onClick={() => openPreview(0)}
          className={`${tapClass} relative ${aspectClass} ${className}`}
        >
          <ImageTile
            displaySrc={single.display}
            fullSrc={single.full}
            altText={alt}
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          {previewBtn}
        </button>
        {!onOpenPreview && (
          <ImagePreviewLightbox
            images={fullImages.length ? fullImages : [imagePath]}
            startIndex={0}
            alt={alt}
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            closeLabel={previewCloseLabel}
          />
        )}
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
          <ImageTile
            displaySrc={current.display}
            fullSrc={current.full}
            altText={alt}
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          {previewBtn}
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-bold text-white">
            {active + 1}/{fullImages.length}
          </span>
        </button>
        <div className="grid grid-cols-3 gap-1 bg-zinc-50 p-1 sm:grid-cols-4">
          {fullImages.map((full, i) => {
            const { display } = srcForIndex(i);
            return (
              <button
                key={`${full}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                onDoubleClick={() => openPreview(i)}
                className={`relative aspect-square overflow-hidden rounded-md border-2 ${
                  i === active ? "border-brand-gold" : "border-transparent"
                }`}
              >
                <Image
                  src={display}
                  alt=""
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="64px"
                  unoptimized={isUnoptimizedSrc(display)}
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (display !== full && el.src !== full) {
                      el.src = full;
                      return;
                    }
                    if (el.src && !el.src.includes("placeholder-design")) {
                      el.src = FALLBACK_DESIGN_IMAGE;
                    }
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      {!onOpenPreview && (
        <ImagePreviewLightbox
          images={fullImages}
          startIndex={previewIndex}
          alt={alt}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          closeLabel={previewCloseLabel}
        />
      )}
    </>
  );
}
