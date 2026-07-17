"use client";

import { useEffect, useRef } from "react";
import { fetchShopTabData } from "@/lib/shop-tab-client-cache";

/**
 * Prefetch light shop tab JSON into the client memory cache so tab switches
 * show data instantly (Option B).
 */
export function ShopTabCacheWarmer() {
  const warmed = useRef(false);

  useEffect(() => {
    if (warmed.current) return;
    warmed.current = true;

    void (async () => {
      try {
        await fetchShopTabData("dashboard");
      } catch {
        /* ignore */
      }
      await Promise.all([
        fetchShopTabData("bills").catch(() => null),
        fetchShopTabData("workers").catch(() => null),
      ]);
      await fetchShopTabData("orders").catch(() => null);
    })();

    const refresh = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void fetchShopTabData("dashboard", "", { force: true }).catch(() => {});
    }, 2 * 60 * 1000);

    return () => window.clearInterval(refresh);
  }, []);

  return null;
}
