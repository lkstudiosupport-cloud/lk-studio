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
import { SHOP_MONTHLY_PRICE_INR, CUSTOMER_MONTHLY_PRICE_INR } from "@/lib/subscription";

function formVal(fd: FormData, key: string): string {
  const v = fd.get(key);
  return v == null ? "" : String(v);
}

export function RegisterForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [role, setRole] = useState<"SHOP" | "CUSTOMER">("CUSTOMER");
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  function switchRole(next: "SHOP" | "CUSTOMER") {
    setRole(next);
    setError("");
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

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          authMethod: "password",
          password: formVal(fd, "password"),
          name,
          phone,
          deviceId: getOrCreateDeviceId(),
          role,
          acceptTerms: true,
          ...(shopName ? { shopName } : {}),
        }),
      });
      const data = await parseApiResponse(res);
      setLoading(false);

      if (!res.ok) {
        const key = typeof data.errorKey === "string" ? data.errorKey : null;
        setError(key ? t(locale, key) : String(data.error ?? "Registration failed"));
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
    <form onSubmit={onSubmit} className="card-premium space-y-4 p-4 sm:p-6">
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
          amount: role === "SHOP" ? SHOP_MONTHLY_PRICE_INR : CUSTOMER_MONTHLY_PRICE_INR,
        })}
      </p>

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
      <input
        name="password"
        type="password"
        required
        minLength={6}
        placeholder={t(locale, "password")}
        className="input-premium w-full"
      />

      <TermsAcceptanceField locale={locale} checked={acceptTerms} onChange={setAcceptTerms} />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading
          ? "..."
          : role === "SHOP"
            ? t(locale, "registerContinueAutopay")
            : t(locale, "registerContinue")}
      </button>

      <div className="pt-2 text-center text-sm">
        <Link href="/" className="block text-brand-green-soft">
          {t(locale, "backHome")}
        </Link>
      </div>
    </form>
  );
}
