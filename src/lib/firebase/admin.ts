import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function parseServiceAccount(): Record<string, string> | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json) return null;
  try {
    return JSON.parse(json) as Record<string, string>;
  } catch {
    console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }
}

export function isFirebaseAdminConfigured(): boolean {
  return parseServiceAccount() !== null;
}

function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0]!;
  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) return null;
  return initializeApp({ credential: cert(serviceAccount) });
}

export function getFirebaseAdminAuth(): Auth | null {
  const app = getAdminApp();
  if (!app) return null;
  return getAuth(app);
}
