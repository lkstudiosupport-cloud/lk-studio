"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function ImagePreviewLightbox({
  images,
  startIndex = 0,
  alt = "Photo",
  open,
  onClose,
  closeLabel = "Close",
}: {
  images: string[];
  startIndex?: number;
  alt?: string;
  open: boolean;
  onClose: () => void;
  closeLabel?: string;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  if (!open || images.length === 0) return null;

  const src = images[index] ?? images[0]!;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">
          {images.length > 1 ? `${index + 1} / ${images.length}` : alt}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 hover:bg-white/20"
          aria-label={closeLabel}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4"
            aria-label="Previous"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        <div className="relative h-full max-h-[80vh] w-full max-w-4xl">
          <Image
            src={src}
            alt={`${alt} ${index + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            unoptimized={src.startsWith("blob:") || src.endsWith(".svg")}
            priority
          />
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
            aria-label="Next"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>
    </div>
  );
}
