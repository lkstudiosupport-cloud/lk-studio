"use client";

import { useEffect } from "react";

/** Ping lightweight health while app is open — reduces Render cold-start delays on tab switch. */
const KEEP_ALIVE_MS = 4 * 60 * 1000;

export function ServerKeepAlive() {
  useEffect(() => {
    async function ping() {
      if (document.visibilityState !== "visible") return;
      try {
        await fetch("/api/health", { cache: "no-store" });
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
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
