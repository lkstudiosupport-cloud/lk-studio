"use client";

import { useCallback, useRef } from "react";

const MIN_SWIPE_PX = 48;

/** Swipe left = next tab, swipe right = previous tab (mobile gesture navigation). */
export function useSwipeTabs<T extends string>(
  tabs: readonly T[],
  activeTab: T,
  onTabChange: (tab: T) => void
) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    start.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!start.current) return;
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
    [tabs, activeTab, onTabChange]
  );

  return { onTouchStart, onTouchEnd };
}
