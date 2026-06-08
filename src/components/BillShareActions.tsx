"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Share2, ArrowLeft, Printer } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { withTimeout } from "@/lib/platform";
import { preloadBillCaptureLib, shareBillImage } from "@/lib/share-bill-image";

const SHARE_TIMEOUT_MS = 25000;

export function BillShareActions({
  locale,
  backHref,
  billNumber,
  shopName,
  showShare,
  compact,
}: {
  locale: Locale;
  backHref: string;
  billNumber?: string;
  shopName?: string;
  showShare?: boolean;
  /** Inline bar for fullscreen receipt hero view. */
  compact?: boolean;
}) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (showShare) preloadBillCaptureLib();
  }, [showShare]);

  async function onShare() {
    setError("");
    setSharing(true);
    try {
      await withTimeout(
        shareBillImage({
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
    ? "bill-detail-actions bill-detail-actions--compact flex min-w-0 flex-1 flex-nowrap items-center gap-1.5"
    : "bill-detail-actions sticky top-0 z-10 mb-4 flex min-w-0 flex-wrap items-center gap-2 border-b border-brand-green/10 bg-brand-cream/95 py-3 backdrop-blur";

  const backLabel = compact ? t(locale, "backShort") : t(locale, "backToBills");
  const shareLabel = sharing ? t(locale, "sharingBill") : t(locale, "shareBill");
  const btnBase = compact
    ? "inline-flex shrink-0 items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold"
    : "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold";

  return (
    <div className={barClass}>
      <Link
        href={backHref}
        className={`${btnBase} bg-white text-brand-green shadow-sm`}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span>{backLabel}</span>
      </Link>
      {showShare && (
        <button
          type="button"
          onClick={onShare}
          disabled={sharing}
          aria-label={t(locale, "shareBill")}
          title={t(locale, "shareBillHint")}
          className={
            compact
              ? "inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-green px-2.5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-70"
              : "inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-70"
          }
        >
          <Share2 className="h-4 w-4 shrink-0" />
          <span>{shareLabel}</span>
        </button>
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => window.print()}
        className={`${btnBase} border border-brand-green/20 bg-white text-brand-green ${compact ? "" : "ml-auto"}`}
      >
        <Printer className="h-4 w-4 shrink-0" />
        <span>{t(locale, "printBill")}</span>
      </button>
    </div>
  );
}
