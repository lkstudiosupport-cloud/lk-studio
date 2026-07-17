"use client";

import { useEffect, useRef } from "react";

/**
 * Prefetch shop tab data into server cache as soon as the shop shell mounts,
 * then refresh light tabs in the background so switches stay fast.
 */
export function ShopTabCacheWarmer() {
  const warmed = useRef(false);

  useEffect(() => {
    if (warmed.current) return;
    warmed.current = true;

    const ctrl = new AbortController();

    async function warm(tab: string) {
      try {
        await fetch(`/api/shop/warm-cache?tab=${tab}`, {
          credentials: "include",
          cache: "no-store",
          signal: ctrl.signal,
        });
      } catch {
        /* ignore */
      }
    }

    // Light tabs first for quick first switches, then full set.
    void (async () => {
      await warm("dashboard");
      await Promise.all([warm("bills"), warm("workers")]);
      await warm("orders");
    })();

    const refresh = window.setInterval(() => {
      if (document.visibilityState === "visible") void warm("dashboard");
    }, 2 * 60 * 1000);

    return () => {
      ctrl.abort();
      window.clearInterval(refresh);
    };
  }, []);

  return null;
}
