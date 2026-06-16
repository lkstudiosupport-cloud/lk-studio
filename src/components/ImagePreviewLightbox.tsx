"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [open]);

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

  if (!open || images.length === 0 || !mounted) return null;

  const src = images[index] ?? images[0]!;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex h-[100dvh] w-full flex-col bg-black touch-none"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${alt} ${index + 1}`}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-3 pb-8 pt-2">
          <span className="pointer-events-auto text-sm font-medium text-white">
            {images.length > 1 ? `${index + 1} / ${images.length}` : alt}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto rounded-full bg-white/15 p-2.5 text-white active:bg-white/25"
            aria-label={closeLabel}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70 sm:left-4"
              aria-label="Previous"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70 sm:right-4"
              aria-label="Next"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
