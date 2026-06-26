import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { app, auth } from "@/lib/firebase";

export { app, auth } from "@/lib/firebase";

export function isFirebaseConfigured(): boolean {
  return app !== null;
}

/** Singleton Firebase app (client-safe). */
export function getFirebaseApp() {
  return app;
}

/** Firebase Auth — browser only (Phone OTP). */
export function getFirebaseAuth() {
  return auth;
}

let analyticsInit: Promise<Analytics | null> | null = null;

/** Google Analytics — browser only; no-op on server or unsupported environments. */
export function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!analyticsInit) {
    analyticsInit = (async () => {
      if (!app) return null;
      if (!(await isSupported())) return null;
      return getAnalytics(app);
    })();
  }
  return analyticsInit;
}
