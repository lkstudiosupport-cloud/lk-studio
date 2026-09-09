"use client";

import { useEffect } from "react";

/** Hide native Capacitor splash once the web UI has mounted. */
async function hideNativeSplash() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    /* browser / plugin missing */
  }
}

/** Wake Render (and similar) with a few quick health retries on cold open. */
async function wakeServer() {
  const gapsMs = [0, 1500, 4000, 9000];
  for (let i = 0; i < gapsMs.length; i++) {
    if (gapsMs[i] > 0) {
      await new Promise((r) => setTimeout(r, gapsMs[i] - (gapsMs[i - 1] ?? 0)));
    }
    try {
      const res = await fetch("/api/health", { cache: "no-store", credentials: "omit" });
      if (res.ok) return;
    } catch {
      /* still waking */
    }
  }
}

/**
 * Native APK: keep branded splash until first paint, then hide.
 * Also kicks /api/health so a sleeping host starts waking immediately.
 */
export function CapAppReady() {
  useEffect(() => {
    void wakeServer();

    const hideSoon = window.setTimeout(() => void hideNativeSplash(), 80);
    const hideSafety = window.setTimeout(() => void hideNativeSplash(), 12_000);

    return () => {
      window.clearTimeout(hideSoon);
      window.clearTimeout(hideSafety);
    };
  }, []);

  return null;
}
