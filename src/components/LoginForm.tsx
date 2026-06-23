"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { parseApiResponse } from "@/lib/parse-api-response";
import { PhoneInput } from "@/components/PhoneInput";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { showDemoLoginUI, showDemoOtpOnScreenUI } from "@/lib/demo-ui";

type LoginMode = "password" | "otp";

export function LoginForm({
  locale,
  role,
}: {
  locale: Locale;
  role: "SHOP" | "CUSTOMER";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("password");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState("");

  function authPayload(extra: Record<string, unknown> = {}) {
    return { phone, role, deviceId: getOrCreateDeviceId(), ...extra };
  }

  async function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          authPayload({ password: fd.get("password") })
        ),
      });

      const data = await parseApiResponse(res);
      setLoading(false);

      if (!res.ok) {
        setError(String(data.error ?? "Login failed"));
        return;
      }

      if (data.requireOtp) {
        setMode("otp");
        setInfo(t(locale, "deviceVerificationRequired"));
        setOtpSent(false);
        setDemoCode("");
        setLoading(false);
        await sendOtp();
        return;
      }

      router.push(String(data.redirect ?? "/"));
      router.refresh();
    } catch {
      setLoading(false);
      setError("Cannot reach server. Keep mobile:dev running on PC.");
    }
  }

  async function sendOtp() {
    setLoading(true);
    setError("");
    setInfo("");
    setDemoCode("");

    try {
      const res = await fetch("/api/auth/login/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role }),
      });
      const data = await parseApiResponse(res);
      setLoading(false);

      if (!res.ok) {
        setError(String(data.error ?? "Could not send code"));
        return;
      }

      setOtpSent(true);
      if (showDemoOtpOnScreenUI() && data.demoCode) setDemoCode(String(data.demoCode));
    } catch {
      setLoading(false);
      setError("Cannot reach server. Keep mobile:dev running on PC.");
    }
  }

  async function onOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          authPayload({ code: fd.get("code") })
        ),
      });

      const data = await parseApiResponse(res);
      setLoading(false);

      if (!res.ok) {
        setError(String(data.error ?? "Login failed"));
        return;
      }

      router.push(String(data.redirect ?? "/"));
      router.refresh();
    } catch {
      setLoading(false);
      setError("Cannot reach server. Keep mobile:dev running on PC.");
    }
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setError("");
    setInfo("");
    setOtpSent(false);
    setDemoCode("");
  }

  return (
    <div className="card-premium min-w-0 space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => switchMode("password")}
          className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold sm:text-sm ${
            mode === "password"
              ? "bg-brand-green text-brand-gold"
              : "bg-brand-green/10 text-brand-green"
          }`}
        >
          {t(locale, "loginWithPassword")}
        </button>
        <button
          type="button"
          onClick={() => switchMode("otp")}
          className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold sm:text-sm ${
            mode === "otp"
              ? "bg-brand-green text-brand-gold"
              : "bg-brand-green/10 text-brand-green"
          }`}
        >
          {t(locale, "loginWithOtp")}
        </button>
      </div>

      {showDemoLoginUI() && (
        <p className="rounded-lg bg-brand-cream px-3 py-2 text-xs text-brand-green-soft">
          {t(locale, "demoCredentials")}
        </p>
      )}

      {mode === "password" ? (
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <PhoneInput locale={locale} value={phone} onChange={setPhone} required />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={t(locale, "password")}
            className="input-premium w-full"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "..." : t(locale, "login")}
          </button>
        </form>
      ) : (
        <form onSubmit={onOtpSubmit} className="space-y-4">
          <PhoneInput locale={locale} value={phone} onChange={setPhone} required />
          {info && <p className="text-sm text-brand-green-soft">{info}</p>}
          {!otpSent ? (
            <button
              type="button"
              disabled={loading || !phone.trim()}
              onClick={sendOtp}
              className="btn-primary w-full py-3"
            >
              {loading ? "..." : t(locale, "sendOtpCode")}
            </button>
          ) : (
            <>
              <p className="text-sm text-brand-green-soft">{t(locale, "otpCodeSent")}</p>
              {showDemoOtpOnScreenUI() && demoCode && (
                <p className="rounded-lg bg-brand-gold/20 px-3 py-2 text-sm text-brand-green">
                  {t(locale, "demoOtpCode")}: <strong>{demoCode}</strong>
                </p>
              )}
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder={t(locale, "otpCode")}
                className="input-premium w-full tracking-widest"
              />
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? "..." : t(locale, "verifyAndLogin")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={sendOtp}
                className="w-full text-sm text-brand-green-soft"
              >
                {t(locale, "resendCode")}
              </button>
            </>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="pt-2 text-center text-sm">
        <Link href="/" className="block text-brand-green-soft">
          {t(locale, "backHome")}
        </Link>
      </div>
    </div>
  );
}
