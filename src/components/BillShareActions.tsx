"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle, ArrowLeft, Printer } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { withTimeout } from "@/lib/platform";
import { preloadBillCaptureLib, shareBillImageOnWhatsApp } from "@/lib/share-bill-image";

const SHARE_TIMEOUT_MS = 25000;

export function BillShareActions({
  locale,
  backHref,
  customerPhone,
  billNumber,
  shopName,
  showWhatsApp,
  compact,
}: {
  locale: Locale;
  backHref: string;
  customerPhone?: string | null;
  billNumber?: string;
  shopName?: string;
  showWhatsApp?: boolean;
  /** Inline bar for fullscreen receipt hero view. */
  compact?: boolean;
}) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (showWhatsApp) preloadBillCaptureLib();
  }, [showWhatsApp]);

  async function onShareWhatsApp() {
    setError("");
    setSharing(true);
    try {
      await withTimeout(
        shareBillImageOnWhatsApp({
          phone: customerPhone,
          fileName: `${billNumber ?? "bill"}.jpg`,
          shopName,
          fallbackHint: t(locale, "shareBillFallback"),
        }),
        SHARE_TIMEOUT_MS,
        t(locale, "shareBillFailed")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "shareBillFailed"));
    } finally {
      setSharing(false);
    }
  }

  const barClass = compact
    ? "bill-detail-actions bill-detail-actions--compact flex min-w-0 flex-1 flex-wrap items-center gap-2"
    : "bill-detail-actions sticky top-0 z-10 mb-4 flex min-w-0 flex-wrap items-center gap-2 border-b border-brand-green/10 bg-brand-cream/95 py-3 backdrop-blur";

  return (
    <div className={barClass}>
      <Link
        href={backHref}
        className={
          compact
            ? "inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-2 text-sm font-semibold text-brand-green shadow-sm"
            : "inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-brand-green shadow-sm"
        }
      >
        <ArrowLeft className="h-4 w-4" />
        {!compact && t(locale, "backToBills")}
      </Link>
      {showWhatsApp && (
        <button
          type="button"
          onClick={onShareWhatsApp}
          disabled={sharing}
          aria-label={t(locale, "sendBillWhatsApp")}
          className={
            compact
              ? "inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white shadow-md disabled:opacity-70"
              : "inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-70"
          }
        >
          <MessageCircle className="h-4 w-4" />
          {!compact && (sharing ? t(locale, "sharingBill") : t(locale, "sendBillWhatsApp"))}
        </button>
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => window.print()}
        className={
          compact
            ? "ml-auto inline-flex items-center gap-1 rounded-xl border border-brand-green/20 bg-white px-2.5 py-2 text-sm font-semibold text-brand-green"
            : "ml-auto inline-flex items-center gap-1 rounded-xl border border-brand-green/20 bg-white px-3 py-2 text-sm font-semibold text-brand-green"
        }
      >
        <Printer className="h-4 w-4" />
        {!compact && t(locale, "printBill")}
      </button>
    </div>
  );
}
