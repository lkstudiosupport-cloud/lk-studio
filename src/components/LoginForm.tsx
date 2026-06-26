"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { parseApiResponse } from "@/lib/parse-api-response";
import { PhoneInput } from "@/components/PhoneInput";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { showDemoLoginUI } from "@/lib/demo-ui";

export function LoginForm({
  locale,
  role,
}: {
  locale: Locale;
  role: "SHOP" | "CUSTOMER";
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  async function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone,
          role,
          deviceId: getOrCreateDeviceId(),
          password: fd.get("password"),
        }),
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

  return (
    <div className="card-premium min-w-0 space-y-4 p-4 sm:p-6">
      {showDemoLoginUI() && (
        <p className="rounded-lg bg-brand-cream px-3 py-2 text-xs text-brand-green-soft">
          {t(locale, "demoCredentials")}
        </p>
      )}

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

      <div className="pt-2 text-center text-sm">
        <Link href="/" className="block text-brand-green-soft">
          {t(locale, "backHome")}
        </Link>
      </div>
    </div>
  );
}
