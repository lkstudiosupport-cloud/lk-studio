"use client";

import { useEffect, useRef, useState } from "react";

/** Lightweight pull-to-refresh for mobile catalogs (incremental sync). */
export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const startY = useRef<number | null>(null);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 4 || refreshingRef.current) return;
      startY.current = e.touches[0]?.clientY ?? null;
    }
    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || refreshingRef.current) return;
      const dy = (e.touches[0]?.clientY ?? 0) - startY.current;
      const next = dy > 64;
      pullingRef.current = next;
      setPulling(next);
    }
    async function onTouchEnd() {
      startY.current = null;
      if (!pullingRef.current || refreshingRef.current) {
        pullingRef.current = false;
        setPulling(false);
        return;
      }
      pullingRef.current = false;
      setPulling(false);
      refreshingRef.current = true;
      setRefreshing(true);
      try {
        await onRefreshRef.current();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return { pulling, refreshing };
}
