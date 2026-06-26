"use client";

import { useEffect } from "react";
import { initFirebaseAnalytics, isFirebaseConfigured } from "@/lib/firebase/client";

/** Loads Firebase Analytics after hydration when NEXT_PUBLIC_FIREBASE_* env vars are set. */
export function FirebaseAnalytics() {
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    void initFirebaseAnalytics();
  }, []);

  return null;
}
