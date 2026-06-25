"use client";

import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

/** Sliding session: refresh JWT while the tab is active (throttled client + server). */
export function SessionRefresh() {
  const lastRefresh = useRef(0);

  useEffect(() => {
    async function refresh() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefresh.current < REFRESH_INTERVAL_MS) return;
      lastRefresh.current = now;

      try {
        await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        /* ignore — user may be offline */
      }
    }

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
