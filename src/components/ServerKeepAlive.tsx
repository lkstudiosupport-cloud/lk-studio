"use client";

import { useEffect } from "react";

/** Ping health while app is open — reduces host sleep between tab switches. */
const KEEP_ALIVE_MS = 4 * 60 * 1000;

export function ServerKeepAlive() {
  useEffect(() => {
    let cancelled = false;

    async function ping() {
      if (document.visibilityState !== "visible" || cancelled) return;
      try {
        await fetch("/api/health", { cache: "no-store", credentials: "omit" });
      } catch {
        /* offline or server waking up */
      }
    }

    void ping();
    const interval = setInterval(ping, KEEP_ALIVE_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
