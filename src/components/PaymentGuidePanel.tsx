"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { buildUpiPayUrl, buildGenericUpiPayUrl } from "@/lib/payment-guide";
import { openPaymentDeepLink } from "@/lib/open-payment-app";
import { Smartphone, Copy, Check } from "lucide-react";

export function PaymentGuidePanel({
  locale,
  amountInr,
  upiId,
  payeeName,
  paymentNote,
  renewAction,
  embedded = false,
}: {
  locale: Locale;
  amountInr: number;
  upiId: string;
  payeeName: string;
  paymentNote: string;
  renewAction: React.ReactNode;
  embedded?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: select not needed on mobile */
    }
  }

  function openPay(app: "phonepe" | "gpay" | "generic") {
    const url = buildUpiPayUrl({ amountInr, note: paymentNote, app });
    openPaymentDeepLink(url);
  }

  function openGPay() {
    const url = buildUpiPayUrl({ amountInr, note: paymentNote, app: "gpay" });
    const query = url.includes("?") ? url.split("?")[1]! : "";
    openPaymentDeepLink(url);
    window.setTimeout(() => openPaymentDeepLink(`tez://upi/pay?${query}`), 700);
  }

  return (
    <div className={embedded ? "space-y-4" : "mt-4 space-y-4 border-t border-zinc-200 pt-4"}>
      <div>
        <p className="text-sm font-semibold text-brand-green">{t(locale, "payGuideTitle")}</p>
        <p className="mt-1 text-xs text-zinc-600">{t(locale, "payGuideHint")}</p>
      </div>

      <ol className="space-y-2 text-sm text-zinc-700">
        <li className="flex gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
            1
          </span>
          {t(locale, "payGuideStep1")}
        </li>
        <li className="flex gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
            2
          </span>
          {t(locale, "payGuideStep2", { amount: amountInr })}
        </li>
        <li className="flex gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
            3
          </span>
          {t(locale, "payGuideStep3")}
        </li>
      </ol>

      <div className="rounded-xl bg-brand-cream/80 p-4">
        <p className="text-xs font-semibold uppercase text-brand-green">{t(locale, "payGuideUpiId")}</p>
        <p className="mt-1 font-mono text-lg font-bold text-zinc-900">{upiId}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {payeeName} · ₹{amountInr}
        </p>
        <button
          type="button"
          onClick={copyUpi}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-green underline"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t(locale, "payGuideCopied") : t(locale, "payGuideCopyUpi")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => openPay("phonepe")}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#5f259f] py-3 text-sm font-semibold text-white"
        >
          <Smartphone className="h-4 w-4" />
          PhonePe
        </button>
        <button
          type="button"
          onClick={openGPay}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#4285F4] py-3 text-sm font-semibold text-white"
        >
          <Smartphone className="h-4 w-4" />
          GPay
        </button>
      </div>

      <button
        type="button"
        onClick={() => openPaymentDeepLink(buildGenericUpiPayUrl({ amountInr, note: paymentNote }))}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-green/25 py-3 text-sm font-semibold text-brand-green"
      >
        {t(locale, "payGuideAnyUpi")}
      </button>

      <div className="rounded-xl border border-dashed border-brand-green/30 p-3">
        <p className="text-xs text-zinc-600">{t(locale, "payGuideAfterPay")}</p>
        <div className="mt-3">{renewAction}</div>
      </div>
    </div>
  );
}
