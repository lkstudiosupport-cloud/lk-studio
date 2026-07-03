"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus, X } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SCALE = 2.5;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

type TouchPoint = { clientX: number; clientY: number };

function touchDistance(t1: TouchPoint, t2: TouchPoint) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

function ZoomablePreviewImage({
  src,
  alt,
  onVerticalSwipe,
}: {
  src: string;
  alt: string;
  onVerticalSwipe?: (direction: "up" | "down") => void;
}) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [animate, setAnimate] = useState(false);

  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);
  const lastTapRef = useRef(0);
  const lastWheelNavRef = useRef(0);

  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
    setAnimate(false);
  }, [src]);

  const resetZoom = useCallback(() => {
    setAnimate(true);
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setAnimate(true);
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next <= MIN_SCALE) setPos({ x: 0, y: 0 });
      return next;
    });
  }, []);

  function onDoubleTap() {
    setAnimate(true);
    if (scale > MIN_SCALE) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    } else {
      setScale(DOUBLE_TAP_SCALE);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    setAnimate(false);
    if (e.touches.length === 2) {
      panRef.current = null;
      swipeRef.current = null;
      pinchRef.current = {
        startDist: touchDistance(e.touches[0]!, e.touches[1]!),
        startScale: scale,
      };
    } else if (e.touches.length === 1) {
      pinchRef.current = null;
      swipeRef.current = {
        startX: e.touches[0]!.clientX,
        startY: e.touches[0]!.clientY,
      };
      if (scale > MIN_SCALE) {
        panRef.current = {
          startX: e.touches[0]!.clientX,
          startY: e.touches[0]!.clientY,
          posX: pos.x,
          posY: pos.y,
        };
      } else {
        panRef.current = null;
      }
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0]!, e.touches[1]!);
      const next = clampScale(pinchRef.current.startScale * (dist / pinchRef.current.startDist));
      setScale(next);
      if (next <= MIN_SCALE) setPos({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && panRef.current && scale > MIN_SCALE) {
      e.preventDefault();
      const t = e.touches[0]!;
      setPos({
        x: panRef.current.posX + (t.clientX - panRef.current.startX),
        y: panRef.current.posY + (t.clientY - panRef.current.startY),
      });
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length === 0) {
      if (
        swipeRef.current &&
        scale <= MIN_SCALE &&
        onVerticalSwipe &&
        e.changedTouches.length === 1
      ) {
        const t = e.changedTouches[0]!;
        const dx = t.clientX - swipeRef.current.startX;
        const dy = t.clientY - swipeRef.current.startY;
        if (Math.abs(dy) >= 50 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          onVerticalSwipe(dy < 0 ? "up" : "down");
        }
      }
      pinchRef.current = null;
      panRef.current = null;
      swipeRef.current = null;
    }
    if (e.changedTouches.length === 1 && e.touches.length === 0 && !pinchRef.current) {
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    if (scale <= MIN_SCALE) return;
    setAnimate(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!panRef.current || e.pointerType === "touch") return;
    setPos({
      x: panRef.current.posX + (e.clientX - panRef.current.startX),
      y: panRef.current.posY + (e.clientY - panRef.current.startY),
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    panRef.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    if (scale <= MIN_SCALE && onVerticalSwipe) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelNavRef.current < 350) return;
      if (Math.abs(e.deltaY) >= 8) {
        lastWheelNavRef.current = now;
        onVerticalSwipe(e.deltaY < 0 ? "up" : "down");
      }
      return;
    }
    e.preventDefault();
    setAnimate(false);
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next <= MIN_SCALE) setPos({ x: 0, y: 0 });
      return next;
    });
  }

  function onDoubleClick(e: React.MouseEvent) {
    e.preventDefault();
    onDoubleTap();
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        className="max-h-full max-w-full select-none object-contain touch-none"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transition: animate ? "transform 0.2s ease-out" : "none",
          cursor: scale > MIN_SCALE ? "grab" : "zoom-in",
        }}
      />

      <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-2 py-1.5 text-white">
        <button
          type="button"
          onClick={() => zoomBy(-0.5)}
          disabled={scale <= MIN_SCALE}
          className="rounded-full p-1.5 active:bg-white/20 disabled:opacity-40"
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="min-w-[3rem] text-xs font-semibold tabular-nums active:opacity-70"
          aria-label="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.5)}
          disabled={scale >= MAX_SCALE}
          className="rounded-full p-1.5 active:bg-white/20 disabled:opacity-40"
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function ImagePreviewLightbox({
  images,
  startIndex = 0,
  alt = "Photo",
  labels,
  open,
  onClose,
  closeLabel = "Close",
  loop = true,
}: {
  images: string[];
  startIndex?: number;
  alt?: string;
  /** Optional caption per slide (e.g. catalog code). */
  labels?: string[];
  open: boolean;
  onClose: () => void;
  closeLabel?: string;
  /** When false, stop at first/last slide (catalog grid browsing). */
  loop?: boolean;
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
    setIndex((i) => {
      if (i <= 0) return loop ? images.length - 1 : 0;
      return i - 1;
    });
  }, [images.length, loop]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= images.length - 1) return loop ? 0 : images.length - 1;
      return i + 1;
    });
  }, [images.length, loop]);

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
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") goPrev();
      if (e.key === "ArrowRight" || e.key === "ArrowUp") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  if (!open || images.length === 0 || !mounted) return null;

  const src = images[index] ?? images[0]!;
  const caption = labels?.[index] ?? (images.length > 1 ? `${index + 1} / ${images.length}` : alt);

  function onVerticalSwipe(direction: "up" | "down") {
    if (direction === "up") goNext();
    else goPrev();
  }

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
        <ZoomablePreviewImage
          key={src}
          src={src}
          alt={`${alt} ${index + 1}`}
          onVerticalSwipe={images.length > 1 ? onVerticalSwipe : undefined}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-3 pb-8 pt-2">
          <span className="pointer-events-auto text-sm font-medium text-white">{caption}</span>
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
              onClick={goNext}
              className="absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+3.25rem)] z-10 -translate-x-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70"
              aria-label="Next photo"
            >
              <ChevronUp className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={goPrev}
              className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70"
              aria-label="Previous photo"
            >
              <ChevronDown className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70 sm:block sm:left-4"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70 sm:block sm:right-4"
              aria-label="Next photo"
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
