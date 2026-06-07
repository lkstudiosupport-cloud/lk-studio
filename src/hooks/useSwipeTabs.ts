"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const MIN_SWIPE_PX = 48;

let swipeBlockCount = 0;
const swipeBlockListeners = new Set<() => void>();

function subscribeSwipeBlock(onStoreChange: () => void) {
  swipeBlockListeners.add(onStoreChange);
  return () => {
    swipeBlockListeners.delete(onStoreChange);
  };
}

function getSwipeBlockSnapshot() {
  return swipeBlockCount > 0;
}

/** Register while a form has unsaved input so main nav swipe stays disabled. */
export function useSwipeNavBlock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    swipeBlockCount += 1;
    swipeBlockListeners.forEach((l) => l());
    return () => {
      swipeBlockCount -= 1;
      swipeBlockListeners.forEach((l) => l());
    };
  }, [active]);
}

export function useIsSwipeNavBlocked(): boolean {
  return useSyncExternalStore(subscribeSwipeBlock, getSwipeBlockSnapshot, () => false);
}

function isInteractiveElement(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return true;
  return el.closest("input, textarea, select, button, [contenteditable='true']") != null;
}

function isHorizontalScrollArea(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  let node: HTMLElement | null = el;
  while (node) {
    const { overflowX } = getComputedStyle(node);
    if (
      (overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay") &&
      node.scrollWidth > node.clientWidth + 1
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function shouldSuppressSwipe(target: EventTarget | null): boolean {
  if (swipeBlockCount > 0) return true;
  const el = target instanceof Element ? target : null;
  if (isInteractiveElement(el)) return true;
  if (isInteractiveElement(document.activeElement)) return true;
  if (isHorizontalScrollArea(el)) return true;
  return false;
}

/** Swipe left = next tab, swipe right = previous tab (mobile gesture navigation). */
export function useSwipeTabs<T extends string>(
  tabs: readonly T[],
  activeTab: T,
  onTabChange: (tab: T) => void,
  enabled = true
) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || shouldSuppressSwipe(e.target)) {
        start.current = null;
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !start.current || shouldSuppressSwipe(e.target)) {
        start.current = null;
        return;
      }
      const touch = e.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;

      if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;

      const index = tabs.indexOf(activeTab);
      if (index < 0) return;

      if (dx < 0 && index < tabs.length - 1) {
        onTabChange(tabs[index + 1]);
        e.stopPropagation();
      } else if (dx > 0 && index > 0) {
        onTabChange(tabs[index - 1]);
        e.stopPropagation();
      }
    },
    [enabled, tabs, activeTab, onTabChange]
  );

  return { onTouchStart, onTouchEnd };
}
