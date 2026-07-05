"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseApiResponse } from "@/lib/parse-api-response";
import { PhoneInput } from "@/components/PhoneInput";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { TermsAcceptanceField } from "@/components/TermsAcceptanceField";
import { SHOP_MONTHLY_PRICE_INR, CUSTOMER_MONTHLY_PRICE_INR, TRIAL_DAYS } from "@/lib/subscription";
import {
  FIREBASE_RECAPTCHA_CONTAINER_ID,
  mapFirebasePhoneAuthError,
  useFirebasePhoneOtp,
} from "@/lib/firebase/phone-auth-client";

type RegisterMode = "password" | "otp";

function formVal(fd: FormData, key: string): string {
  const v = fd.get(key);
  return v == null ? "" : String(v);
}

export function RegisterForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { sendOtp, verifyOtpAndGetIdToken, resetRecaptcha } = useFirebasePhoneOtp();
  const [error, setError] = useState("");
  const [role, setRole] = useState<"SHOP" | "CUSTOMER">("CUSTOMER");
  const [mode, setMode] = useState<RegisterMode>("otp");
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loginHintRole, setLoginHintRole] = useState<"SHOP" | "CUSTOMER" | null>(null);

  async function checkPhoneAvailable(): Promise<boolean> {
    setLoginHintRole(null);
    if (!phone.trim()) return false;

    const res = await fetch("/api/auth/check-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, role }),
    });
    const data = await parseApiResponse(res);
    if (data.available) return true;

    const key = typeof data.errorKey === "string" ? data.errorKey : null;
    setError(key ? t(locale, key) : String(data.error ?? t(locale, "phoneAlreadyRegistered")));
    const loginRole =
      data.loginRole === "SHOP" || data.loginRole === "CUSTOMER" ? data.loginRole : role;
    setLoginHintRole(loginRole);
    return false;
  }

  function switchMode(next: RegisterMode) {
    setMode(next);
    setError("");
    setOtpSent(false);
    setLoginHintRole(null);
    resetRecaptcha();
  }

  function switchRole(next: "SHOP" | "CUSTOMER") {
    setRole(next);
    setError("");
    setOtpSent(false);
    setLoginHintRole(null);
    resetRecaptcha();
  }

  async function sendFirebaseOtp() {
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    setLoginHintRole(null);

    try {
      const available = await checkPhoneAvailable();
      if (!available) {
        setLoading(false);
        return;
      }
      await sendOtp(phone);
      setOtpSent(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(mapFirebasePhoneAuthError(err));
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!acceptTerms) {
      setError(t(locale, "acceptTermsRequired"));
      return;
    }

    const fd = new FormData(e.currentTarget);
    const name = formVal(fd, "name");
    const shopName = role === "SHOP" ? formVal(fd, "shopName") : undefined;

    if (mode === "otp" && !otpSent) {
      await sendFirebaseOtp();
      return;
    }

    setLoading(true);

    try {
      const available = await checkPhoneAvailable();
      if (!available) {
        setLoading(false);
        return;
      }

      const body =
        mode === "password"
          ? {
              authMethod: "password" as const,
              password: formVal(fd, "password"),
              name,
              phone,
              deviceId: getOrCreateDeviceId(),
              role,
              acceptTerms: true as const,
              ...(shopName ? { shopName } : {}),
            }
          : {
              authMethod: "otp" as const,
              idToken: await verifyOtpAndGetIdToken(formVal(fd, "otpCode")),
              name,
              phone,
              deviceId: getOrCreateDeviceId(),
              role,
              acceptTerms: true as const,
              ...(shopName ? { shopName } : {}),
            };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await parseApiResponse(res);
      setLoading(false);

      if (!res.ok) {
        const key = typeof data.errorKey === "string" ? data.errorKey : null;
        setError(key ? t(locale, key) : String(data.error ?? "Registration failed"));
        if (key === "phoneAlreadyRegistered" || key === "phoneAlreadyShop" || key === "phoneAlreadyCustomer") {
          setLoginHintRole(
            key === "phoneAlreadyShop" ? "SHOP" : key === "phoneAlreadyCustomer" ? "CUSTOMER" : role
          );
        }
        return;
      }
      router.push(String(data.redirect ?? "/"));
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(mapFirebasePhoneAuthError(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-premium space-y-4 p-4 sm:p-6">
      <div id={FIREBASE_RECAPTCHA_CONTAINER_ID} className="hidden" aria-hidden />

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => switchRole("CUSTOMER")}
          className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold sm:text-sm ${
            role === "CUSTOMER" ? "bg-brand-gold text-brand-green" : "bg-brand-green/10 text-brand-green"
          }`}
        >
          {t(locale, "customer")}
        </button>
        <button
          type="button"
          onClick={() => switchRole("SHOP")}
          className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold sm:text-sm ${
            role === "SHOP" ? "bg-brand-green text-brand-gold" : "bg-brand-green/10 text-brand-green"
          }`}
        >
          {t(locale, "registerRoleBusiness", { amount: SHOP_MONTHLY_PRICE_INR })}
        </button>
      </div>

      <p className="rounded-lg bg-brand-cream/60 px-3 py-2 text-xs text-zinc-700">
        {t(locale, "registerTrialNote", {
          days: TRIAL_DAYS,
          amount: role === "SHOP" ? SHOP_MONTHLY_PRICE_INR : CUSTOMER_MONTHLY_PRICE_INR,
        })}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => switchMode("otp")}
          className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold sm:text-sm ${
            mode === "otp" ? "bg-brand-green text-brand-gold" : "bg-brand-green/10 text-brand-green"
          }`}
        >
          {t(locale, "registerWithOtp")}
        </button>
        <button
          type="button"
          onClick={() => switchMode("password")}
          className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold sm:text-sm ${
            mode === "password"
              ? "bg-brand-green text-brand-gold"
              : "bg-brand-green/10 text-brand-green"
          }`}
        >
          {t(locale, "registerWithPassword")}
        </button>
      </div>

      <input name="name" required placeholder={t(locale, "name")} className="input-premium w-full" />
      {role === "SHOP" && (
        <input
          name="shopName"
          required
          placeholder={t(locale, "shopName")}
          className="input-premium w-full"
        />
      )}
      <PhoneInput locale={locale} value={phone} onChange={setPhone} required />

      {mode === "password" ? (
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder={t(locale, "password")}
          className="input-premium w-full"
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">{t(locale, "registerOtpHint")}</p>
          {!otpSent ? (
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="btn-secondary w-full py-3"
            >
              {loading ? "..." : t(locale, "sendOtpCode")}
            </button>
          ) : (
            <>
              <p className="text-sm text-brand-green-soft">{t(locale, "otpCodeSent")}</p>
              <input
                name="otpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder={t(locale, "otpCode")}
                className="input-premium w-full tracking-widest"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => void sendFirebaseOtp()}
                className="w-full text-sm text-brand-green-soft"
              >
                {t(locale, "resendCode")}
              </button>
            </>
          )}
        </div>
      )}

      <TermsAcceptanceField locale={locale} checked={acceptTerms} onChange={setAcceptTerms} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loginHintRole && (
        <Link
          href={loginHintRole === "SHOP" ? "/login/shop" : "/login/customer"}
          className="block text-center text-sm font-semibold text-brand-green underline"
        >
          {t(locale, "phoneAlreadyUseLogin")} →
        </Link>
      )}

      {(mode === "password" || otpSent) && (
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading
            ? "..."
            : mode === "otp"
              ? t(locale, "verifyAndRegister")
              : t(locale, "registerContinue")}
        </button>
      )}

      <div className="pt-2 text-center text-sm">
        <Link href="/" className="block text-brand-green-soft">
          {t(locale, "backHome")}
        </Link>
      </div>
    </form>
  );
}
