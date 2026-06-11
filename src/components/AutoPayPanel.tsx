"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, RefreshCw, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { AutopayRole } from "@/lib/subscription-autopay";
import { enableAutopayDemo } from "@/app/subscription-autopay-actions";
import { readApiJson } from "@/lib/api-json";

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    if (document.getElementById("razorpay-checkout-js")) {
      const poll = window.setInterval(() => {
        if (window.Razorpay) {
          window.clearInterval(poll);
          resolve(true);
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(poll);
        resolve(Boolean(window.Razorpay));
      }, 8000);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function AutoPayPanel({
  locale,
  role,
  amountInr,
  autopayEnabled,
  razorpayConfigured,
  payeeLabel,
  embedded = false,
  onboarding = false,
  onSuccess,
}: {
  locale: Locale;
  role: AutopayRole;
  amountInr: number;
  autopayEnabled: boolean;
  razorpayConfigured: boolean;
  payeeLabel: string;
  embedded?: boolean;
  onboarding?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startAutopay() {
    setError("");
    setBusy(true);
    try {
      if (!razorpayConfigured) {
        await enableAutopayDemo(role);
        if (onSuccess) onSuccess();
        else router.refresh();
        return;
      }

      const res = await fetch("/api/subscription/autopay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await readApiJson<{
        ok?: boolean;
        error?: string;
        keyId?: string;
        subscriptionId?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not start autopay");
      if (!data.keyId || !data.subscriptionId) {
        throw new Error(data.error ?? "Could not start autopay");
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) throw new Error(t(locale, "autopayScriptFailed"));

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: data.keyId,
          subscription_id: data.subscriptionId,
          name: t(locale, "appName"),
          description: t(locale, "autopayDescription", { amount: amountInr }),
          prefill: { name: payeeLabel },
          theme: { color: "#1b3022" },
          handler: async (response: unknown) => {
            const r = response as {
              razorpay_payment_id: string;
              razorpay_subscription_id: string;
              razorpay_signature: string;
            };
            const verify = await fetch("/api/subscription/autopay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role,
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_subscription_id: r.razorpay_subscription_id,
                razorpay_signature: r.razorpay_signature,
              }),
            });
            const verifyData = await readApiJson<{ ok?: boolean; error?: string }>(verify);
            if (!verify.ok) throw new Error(verifyData.error ?? "Verification failed");
            resolve();
          },
          modal: {
            ondismiss: () => reject(new Error(t(locale, "autopayCancelled"))),
          },
        });
        rzp.open();
      });

      if (onSuccess) onSuccess();
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "autopayFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (autopayEnabled) {
    return (
      <div
        className={`rounded-xl border border-emerald-200 bg-emerald-50 p-4 ${
          embedded ? "" : "mt-4"
        }`}
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <RefreshCw className="h-4 w-4" />
          {t(locale, "autopayActive")}
        </p>
        <p className="mt-1 text-xs text-emerald-900">
          {t(locale, "autopayActiveHint", { amount: amountInr })}
        </p>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "mt-4 space-y-4 border-t border-zinc-200 pt-4"}>
      {!onboarding && (
        <>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-green">
              <ShieldCheck className="h-4 w-4" />
              {t(locale, "autopayTitle")}
            </p>
            <p className="mt-1 text-xs text-zinc-600">{t(locale, "autopayHint")}</p>
          </div>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                1
              </span>
              {t(locale, "autopayStep1")}
            </li>
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                2
              </span>
              {t(locale, "autopayStep2", { amount: amountInr })}
            </li>
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                3
              </span>
              {t(locale, "autopayStep3")}
            </li>
          </ul>
        </>
      )}

      <div className="rounded-xl border border-dashed border-brand-green/30 bg-brand-cream/40 p-4">
        {!razorpayConfigured && (
          <p className="mb-3 text-xs text-amber-800">{t(locale, "autopayDemoNote")}</p>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void startAutopay()}
          className="btn-primary inline-flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60"
        >
          <CreditCard className="h-4 w-4" />
          {busy
            ? t(locale, "autopayStarting")
            : onboarding
              ? t(locale, "autopayOnboardingButton", { amount: amountInr })
              : t(locale, "autopayEnable", { amount: amountInr })}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
