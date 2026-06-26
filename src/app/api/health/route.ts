import { NextResponse } from "next/server";
import { storageBackend } from "@/lib/storage-backend";
import {
  firebasePhoneAuthConfigError,
  isFirebasePhoneAuthConfigured,
} from "@/lib/firebase/phone-auth-server";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

/** Lightweight health check for Render — no DB or Supabase network calls. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "lk-studio",
      storageBackend: storageBackend(),
      otp: {
        provider: "firebase-phone",
        firebaseClient: isFirebaseConfigured(),
        firebaseAdmin: isFirebaseAdminConfigured(),
        ready: isFirebasePhoneAuthConfigured(),
        ...(isFirebasePhoneAuthConfigured()
          ? {}
          : { configError: firebasePhoneAuthConfigError() }),
      },
    },
    { status: 200 }
  );
}
