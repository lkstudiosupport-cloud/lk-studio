import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { firebasePhoneMatches } from "@/lib/firebase/phone-match";

export function isFirebasePhoneAuthConfigured(): boolean {
  return isFirebaseConfigured() && isFirebaseAdminConfigured();
}

export function firebasePhoneAuthConfigError(): string | null {
  if (!isFirebaseConfigured()) {
    return "Firebase client env vars are not set (NEXT_PUBLIC_FIREBASE_*)";
  }
  if (!isFirebaseAdminConfigured()) {
    return "FIREBASE_SERVICE_ACCOUNT_JSON is not set on the server";
  }
  return null;
}

/** Verify Firebase Phone Auth ID token and ensure it matches the submitted phone. */
export async function verifyFirebasePhoneToken(
  idToken: string,
  expectedE164: string
): Promise<boolean> {
  const auth = getFirebaseAdminAuth();
  if (!auth) return false;

  try {
    const decoded = await auth.verifyIdToken(idToken.trim());
    const phone = decoded.phone_number;
    if (!phone || typeof phone !== "string") return false;
    return firebasePhoneMatches(phone, expectedE164);
  } catch (err) {
    console.error("Firebase phone token verification failed:", err);
    return false;
  }
}
