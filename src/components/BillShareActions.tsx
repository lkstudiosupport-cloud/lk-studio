"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, ArrowLeft, Printer } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { shareBillImageOnWhatsApp } from "@/lib/share-bill-image";

export function BillShareActions({
  locale,
  backHref,
  customerPhone,
  billNumber,
  shopName,
  showWhatsApp,
}: {
  locale: Locale;
  backHref: string;
  customerPhone?: string | null;
  billNumber?: string;
  shopName?: string;
  showWhatsApp?: boolean;
}) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  async function onShareWhatsApp() {
    setError("");
    setSharing(true);
    try {
      await shareBillImageOnWhatsApp({
        phone: customerPhone,
        fileName: `${billNumber ?? "bill"}.png`,
        shopName,
        fallbackHint: t(locale, "shareBillFallback"),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "shareBillFailed"));
    }
    setSharing(false);
  }

  return (
    <div className="bill-detail-actions sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-2 border-b border-brand-green/10 bg-brand-page-bg/95 px-4 py-3 backdrop-blur">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-brand-green shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(locale, "backToBills")}
      </Link>
      {showWhatsApp && (
        <button
          type="button"
          onClick={onShareWhatsApp}
          disabled={sharing}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-70"
        >
          <MessageCircle className="h-4 w-4" />
          {sharing ? t(locale, "sharingBill") : t(locale, "sendBillWhatsApp")}
        </button>
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => window.print()}
        className="ml-auto inline-flex items-center gap-1 rounded-xl border border-brand-green/20 bg-white px-3 py-2 text-sm font-semibold text-brand-green"
      >
        <Printer className="h-4 w-4" />
        {t(locale, "printBill")}
      </button>
    </div>
  );
}
