"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus, X } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SCALE = 3;
const SWIPE_MIN_PX = 32;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function touchMidpoint(t1: TouchPoint, t2: TouchPoint) {
  return {
    clientX: (t1.clientX + t2.clientX) / 2,
    clientY: (t1.clientY + t2.clientY) / 2,
  };
}

function posAtScale(
  focal: { x: number; y: number },
  startPos: { x: number; y: number },
  startScale: number,
  nextScale: number
) {
  if (nextScale <= MIN_SCALE) return { x: 0, y: 0 };
  const ratio = nextScale / startScale;
  return {
    x: focal.x - (focal.x - startPos.x) * ratio,
    y: focal.y - (focal.y - startPos.y) * ratio,
  };
}

function clampPan(
  pos: { x: number; y: number },
  scale: number,
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number
) {
  if (scale <= MIN_SCALE) return { x: 0, y: 0 };
  if (!imgW || !imgH) return pos;
  const fit = Math.min(containerW / imgW, containerH / imgH);
  const dispW = imgW * fit * scale;
  const dispH = imgH * fit * scale;
  const maxX = Math.max(0, (dispW - containerW) / 2);
  const maxY = Math.max(0, (dispH - containerH) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, pos.x)),
    y: Math.min(maxY, Math.max(-maxY, pos.y)),
  };
}

type TouchPoint = { clientX: number; clientY: number };

function touchDistance(t1: TouchPoint, t2: TouchPoint) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

export type NavigationGateRef = { current: { canNavigate: () => boolean } };

/** Full-area swipe / scroll / drag — attached to the lightbox pane, not the img. */
function useVerticalSlideNavigation({
  targetRef,
  enabled,
  canNavigate,
  onUp,
  onDown,
  onHandled,
}: {
  targetRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  canNavigate: () => boolean;
  onUp: () => void;
  onDown: () => void;
  onHandled?: () => void;
}) {
  const onUpRef = useRef(onUp);
  const onDownRef = useRef(onDown);
  const onHandledRef = useRef(onHandled);
  const canNavigateRef = useRef(canNavigate);
  const lastWheelRef = useRef(0);

  onUpRef.current = onUp;
  onDownRef.current = onDown;
  onHandledRef.current = onHandled;
  canNavigateRef.current = canNavigate;

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !enabled) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pointerId: number | null = null;

    function tryNavigate(dx: number, dy: number) {
      if (!canNavigateRef.current()) return false;
      if (Math.abs(dy) < SWIPE_MIN_PX || Math.abs(dy) <= Math.abs(dx) * 1.05) return false;
      onHandledRef.current?.();
      if (dy < 0) onUpRef.current();
      else onDownRef.current();
      return true;
    }

    function onTouchStart(e: TouchEvent) {
      if (!canNavigateRef.current() || e.touches.length !== 1) {
        tracking = false;
        return;
      }
      tracking = true;
      startX = e.touches[0]!.clientX;
      startY = e.touches[0]!.clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (!tracking || !canNavigateRef.current() || e.touches.length !== 1) return;
      const dy = e.touches[0]!.clientY - startY;
      const dx = e.touches[0]!.clientX - startX;
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        e.preventDefault();
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      tryNavigate(t.clientX - startX, t.clientY - startY);
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (!canNavigateRef.current()) return;
      pointerId = e.pointerId;
      tracking = true;
      startX = e.clientX;
      startY = e.clientY;
    }

    function onPointerMove(e: PointerEvent) {
      if (!tracking || pointerId !== e.pointerId) return;
      if (!canNavigateRef.current()) return;
      const dy = e.clientY - startY;
      const dx = e.clientX - startX;
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        e.preventDefault();
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (!tracking || pointerId !== e.pointerId) return;
      tracking = false;
      pointerId = null;
      tryNavigate(e.clientX - startX, e.clientY - startY);
    }

    function onWheel(e: WheelEvent) {
      if (!canNavigateRef.current()) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelRef.current < 300) return;
      if (Math.abs(e.deltaY) < 6) return;
      lastWheelRef.current = now;
      onHandledRef.current?.();
      if (e.deltaY < 0) onUpRef.current();
      else onDownRef.current();
    }

    el.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    el.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    el.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { capture: true, passive: true });
    el.addEventListener("pointerdown", onPointerDown, { capture: true });
    el.addEventListener("pointermove", onPointerMove, { capture: true });
    el.addEventListener("pointerup", onPointerUp, { capture: true });
    el.addEventListener("pointercancel", onPointerUp, { capture: true });
    el.addEventListener("wheel", onWheel, { capture: true, passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart, { capture: true });
      el.removeEventListener("touchmove", onTouchMove, { capture: true });
      el.removeEventListener("touchend", onTouchEnd, { capture: true });
      el.removeEventListener("touchcancel", onTouchEnd, { capture: true });
      el.removeEventListener("pointerdown", onPointerDown, { capture: true });
      el.removeEventListener("pointermove", onPointerMove, { capture: true });
      el.removeEventListener("pointerup", onPointerUp, { capture: true });
      el.removeEventListener("pointercancel", onPointerUp, { capture: true });
      el.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [enabled, targetRef]);
}

function ZoomablePreviewImage({
  src,
  alt,
  navigationGate,
}: {
  src: string;
  alt: string;
  navigationGate: NavigationGateRef;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [animate, setAnimate] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const scaleRef = useRef(1);
  const posRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    startPos: { x: number; y: number };
    focal: { x: number; y: number };
  } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const lastTapRef = useRef(0);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    scaleRef.current = scale;
    navigationGate.current = { canNavigate: () => scaleRef.current <= MIN_SCALE + 0.001 };
  }, [scale, navigationGate]);

  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
    setAnimate(false);
    scaleRef.current = 1;
    posRef.current = { x: 0, y: 0 };
    navigationGate.current = { canNavigate: () => true };
  }, [src, navigationGate]);

  const focalFromClient = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2),
    };
  }, []);

  const applyPanClamp = useCallback(
    (nextPos: { x: number; y: number }, nextScale: number) => {
      const el = containerRef.current;
      if (!el || nextScale <= MIN_SCALE) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return clampPan(nextPos, nextScale, rect.width, rect.height, imgSize.w, imgSize.h);
    },
    [imgSize]
  );

  useEffect(() => {
    if (!imgSize.w || !imgSize.h || scale <= MIN_SCALE) return;
    setPos((current) => applyPanClamp(current, scale));
  }, [imgSize, scale, applyPanClamp]);

  const setZoomAt = useCallback(
    (nextScale: number, focal: { x: number; y: number }, withAnimate: boolean) => {
      const clamped = clampScale(nextScale);
      if (clamped <= MIN_SCALE) {
        setAnimate(withAnimate);
        setScale(1);
        setPos({ x: 0, y: 0 });
        return;
      }
      const startScale = scaleRef.current;
      const startPos = posRef.current;
      const nextPos = applyPanClamp(posAtScale(focal, startPos, startScale, clamped), clamped);
      setAnimate(withAnimate);
      setScale(clamped);
      setPos(nextPos);
    },
    [applyPanClamp]
  );

  const resetZoom = useCallback(() => {
    setAnimate(true);
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback(
    (delta: number) => {
      setZoomAt(scaleRef.current + delta, { x: 0, y: 0 }, true);
    },
    [setZoomAt]
  );

  const onDoubleTap = useCallback(
    (clientX: number, clientY: number) => {
      const focal = focalFromClient(clientX, clientY);
      if (scaleRef.current > MIN_SCALE) {
        resetZoom();
      } else {
        setZoomAt(DOUBLE_TAP_SCALE, focal, true);
      }
    },
    [focalFromClient, resetZoom, setZoomAt]
  );

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.stopPropagation();
      setAnimate(false);
      const mid = touchMidpoint(e.touches[0]!, e.touches[1]!);
      panRef.current = null;
      pinchRef.current = {
        startDist: touchDistance(e.touches[0]!, e.touches[1]!),
        startScale: scaleRef.current,
        startPos: { ...posRef.current },
        focal: focalFromClient(mid.clientX, mid.clientY),
      };
    } else if (e.touches.length === 1 && scaleRef.current > MIN_SCALE) {
      e.stopPropagation();
      setAnimate(false);
      pinchRef.current = null;
      panRef.current = {
        startX: e.touches[0]!.clientX,
        startY: e.touches[0]!.clientY,
        posX: posRef.current.x,
        posY: posRef.current.y,
      };
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const dist = touchDistance(e.touches[0]!, e.touches[1]!);
      const nextScale = clampScale(pinchRef.current.startScale * (dist / pinchRef.current.startDist));
      const nextPos = applyPanClamp(
        posAtScale(
          pinchRef.current.focal,
          pinchRef.current.startPos,
          pinchRef.current.startScale,
          nextScale
        ),
        nextScale
      );
      setScale(nextScale);
      setPos(nextPos);
    } else if (e.touches.length === 1 && panRef.current && scaleRef.current > MIN_SCALE) {
      e.preventDefault();
      e.stopPropagation();
      const t = e.touches[0]!;
      const nextPos = applyPanClamp(
        {
          x: panRef.current.posX + (t.clientX - panRef.current.startX),
          y: panRef.current.posY + (t.clientY - panRef.current.startY),
        },
        scaleRef.current
      );
      setPos(nextPos);
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length === 0) {
      pinchRef.current = null;
      panRef.current = null;
    } else if (e.touches.length === 1 && pinchRef.current) {
      pinchRef.current = null;
      if (scaleRef.current > MIN_SCALE) {
        panRef.current = {
          startX: e.touches[0]!.clientX,
          startY: e.touches[0]!.clientY,
          posX: posRef.current.x,
          posY: posRef.current.y,
        };
      }
    }

    if (e.changedTouches.length === 1 && e.touches.length === 0 && scaleRef.current <= MIN_SCALE + 0.001) {
      const t = e.changedTouches[0]!;
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        onDoubleTap(t.clientX, t.clientY);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    if (scaleRef.current <= MIN_SCALE) return;
    e.stopPropagation();
    setAnimate(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!panRef.current || e.pointerType === "touch") return;
    e.stopPropagation();
    setPos(
      applyPanClamp(
        {
          x: panRef.current.posX + (e.clientX - panRef.current.startX),
          y: panRef.current.posY + (e.clientY - panRef.current.startY),
        },
        scaleRef.current
      )
    );
  }

  function onPointerUp(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    panRef.current = null;
  }

  function onDoubleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDoubleTap(e.clientX, e.clientY);
  }

  function onWheel(e: React.WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoomAt(scaleRef.current + delta, focalFromClient(e.clientX, e.clientY), false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative z-[1] flex h-full w-full items-center justify-center overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        className="max-h-full max-w-full select-none object-contain"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transition: animate ? "transform 0.2s ease-out" : "none",
          cursor: scale > MIN_SCALE ? "grab" : "zoom-in",
          touchAction: "none",
        }}
      />

      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-2 py-1.5 text-white">
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
  labels?: string[];
  open: boolean;
  onClose: () => void;
  closeLabel?: string;
  loop?: boolean;
}) {
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const navigationGate = useRef({ canNavigate: () => true });
  const suppressCloseRef = useRef(false);

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

  const markSwipeHandled = useCallback(() => {
    suppressCloseRef.current = true;
    window.setTimeout(() => {
      suppressCloseRef.current = false;
    }, 400);
  }, []);

  const canNavigate = useCallback(() => navigationGate.current.canNavigate(), []);

  const multi = images.length > 1;

  useVerticalSlideNavigation({
    targetRef: paneRef,
    enabled: open && multi,
    canNavigate,
    onUp: goNext,
    onDown: goPrev,
    onHandled: markSwipeHandled,
  });

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
  const caption = labels?.[index] ?? (multi ? `${index + 1} / ${images.length}` : alt);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex h-[100dvh] w-full flex-col bg-black"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={() => {
        if (suppressCloseRef.current) return;
        onClose();
      }}
    >
      <div
        ref={paneRef}
        className="relative flex h-full min-h-0 w-full flex-1 touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <ZoomablePreviewImage
          key={`preview-${index}`}
          src={src}
          alt={`${alt} ${index + 1}`}
          navigationGate={navigationGate}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-3 pb-8 pt-2">
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

        {multi && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+3.25rem)] z-30 -translate-x-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70"
              aria-label="Next photo"
            >
              <ChevronUp className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70"
              aria-label="Previous photo"
            >
              <ChevronDown className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70 sm:block sm:left-4"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white active:bg-black/70 sm:block sm:right-4"
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
