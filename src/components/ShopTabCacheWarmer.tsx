"use client";

import { useEffect, useRef } from "react";

/** Loads shop tab data into server cache once per session for faster tab switches. */
export function ShopTabCacheWarmer() {
  const warmed = useRef(false);

  useEffect(() => {
    if (warmed.current) return;
    warmed.current = true;
    void fetch("/api/shop/warm-cache", { credentials: "include", cache: "no-store" }).catch(
      () => {}
    );
  }, []);

  return null;
}
