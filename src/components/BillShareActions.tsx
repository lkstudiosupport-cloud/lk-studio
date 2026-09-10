"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Share2, ArrowLeft, Pencil } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { preloadBillCaptureLib, shareBillImage, billShareCacheKey, clearBillShareCache } from "@/lib/share-bill-image";
import type { BillReceiptData } from "@/lib/bill-receipt-text";
import { BillReadAloudButton } from "@/components/BillReadAloudButton";

export function BillShareActions({
  locale,
  backHref,
  billNumber,
  shopName,
  showShare,
  editHref,
  compact,
  dock,
  itemsJson,
  amount,
  receipt,
}: {
  locale: Locale;
  backHref: string;
  billNumber?: string;
  shopName?: string;
  showShare?: boolean;
  editHref?: string;
  /** Inline bar for fullscreen receipt hero view. */
  compact?: boolean;
  /** Fixed bottom dock — always visible above page chrome. */
  dock?: boolean;
  itemsJson?: string;
  amount?: number;
  /** When set, show speaker to read S.No / items / totals aloud. */
  receipt?: BillReceiptData;
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
      // Fresh capture every share — avoids stale/blank images after edits.
      clearBillShareCache();
      await shareBillImage({
        fileName: `${billNumber ?? "bill"}.jpg`,
        shopName,
        fallbackHint: t(locale, "shareBillFallback"),
        cacheKey:
          billNumber && itemsJson != null && amount != null
            ? billShareCacheKey(billNumber, itemsJson, amount)
            : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "shareBillFailed"));
    } finally {
      setSharing(false);
    }
  }

  const barClass = dock
    ? "bill-detail-actions bill-detail-actions--dock flex w-full min-w-0 flex-nowrap items-center justify-center gap-2"
    : compact
      ? "bill-detail-actions bill-detail-actions--compact flex min-w-0 flex-1 flex-nowrap items-center gap-1.5"
      : "bill-detail-actions sticky top-[var(--app-sticky-under-header)] z-40 mb-4 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto border-b border-brand-green/10 bg-brand-cream/95 py-3 backdrop-blur";

  const backLabel = compact || dock ? t(locale, "backShort") : t(locale, "backToBills");
  const shareLabel = sharing ? t(locale, "sharingBill") : t(locale, "shareBill");
  const btnBase =
    compact || dock
      ? "inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2.5 text-xs font-semibold"
      : "inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold";

  return (
    <div className={barClass}>
      <Link
        href={backHref}
        className={`${btnBase} bg-white text-brand-green shadow-sm`}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span>{backLabel}</span>
      </Link>
      {editHref && (
        <Link
          href={editHref}
          className={`${btnBase} border border-brand-green/20 bg-white text-brand-green`}
        >
          <Pencil className="h-4 w-4 shrink-0" />
          <span>{compact || dock ? t(locale, "editShort") : t(locale, "editBill")}</span>
        </Link>
      )}
      {showShare && (
        <button
          type="button"
          onClick={onShare}
          disabled={sharing}
          aria-label={t(locale, "shareBill")}
          title={t(locale, "shareBillHint")}
          className={
            compact || dock
              ? "inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-green px-3 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-70"
              : "inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-70"
          }
        >
          <Share2 className="h-4 w-4 shrink-0" />
          <span>{shareLabel}</span>
        </button>
      )}
      {/* Read after Edit/Share */}
      {receipt && (
        <BillReadAloudButton locale={locale} bill={receipt} compact={Boolean(compact) && !dock} />
      )}
      {error && <p className="w-full shrink-0 basis-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
