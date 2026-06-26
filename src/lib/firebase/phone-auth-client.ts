"use client";

import { useCallback, useRef } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth, app } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { resolvePhoneE164 } from "@/lib/phone";

export const FIREBASE_RECAPTCHA_CONTAINER_ID = "firebase-phone-recaptcha";

function toE164Plus(e164Digits: string): string {
  return e164Digits.startsWith("+") ? e164Digits : `+${e164Digits}`;
}

export function mapFirebasePhoneAuthError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    if (code === "auth/invalid-verification-code") return "Invalid verification code";
    if (code === "auth/code-expired") return "Code expired — request a new one";
    if (code === "auth/too-many-requests") return "Too many attempts — try again later";
    if (code === "auth/invalid-phone-number") return "Invalid phone number";
    if (code === "auth/captcha-check-failed") return "Verification check failed — try again";
    if (code === "auth/quota-exceeded") return "SMS quota exceeded — try again later";
    if (code === "auth/operation-not-allowed") {
      return "SMS not allowed for this region — enable India in Firebase SMS region settings";
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return "Phone verification failed";
}

export function useFirebasePhoneOtp() {
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const resetRecaptcha = useCallback(() => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      /* ignore */
    }
    recaptchaRef.current = null;
    confirmationRef.current = null;
    const el = document.getElementById(FIREBASE_RECAPTCHA_CONTAINER_ID);
    if (el) el.innerHTML = "";
  }, []);

  const sendOtp = useCallback(
    async (phoneInput: string) => {
      if (!isFirebaseConfigured() || !auth || !app) {
        throw new Error("Firebase is not configured");
      }

      const e164 = resolvePhoneE164(phoneInput);
      if (!e164) throw new Error("Enter a valid mobile number");

      resetRecaptcha();

      if (!document.getElementById(FIREBASE_RECAPTCHA_CONTAINER_ID)) {
        throw new Error("reCAPTCHA container missing");
      }

      recaptchaRef.current = new RecaptchaVerifier(auth, FIREBASE_RECAPTCHA_CONTAINER_ID, {
        size: "invisible",
      });

      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        toE164Plus(e164),
        recaptchaRef.current
      );

      return e164;
    },
    [resetRecaptcha]
  );

  const verifyOtpAndGetIdToken = useCallback(async (code: string) => {
    if (!confirmationRef.current) throw new Error("Send OTP first");
    const cred = await confirmationRef.current.confirm(code.trim());
    return cred.user.getIdToken();
  }, []);

  return { sendOtp, verifyOtpAndGetIdToken, resetRecaptcha };
}
