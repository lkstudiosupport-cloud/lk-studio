"use client";

import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { BillReceiptData } from "@/lib/bill-receipt-text";
import {
  buildBillReadAloudScript,
  speakBillScript,
  stopBillSpeech,
  type BillSpeechLabels,
} from "@/lib/bill-speech";

function labelsFor(locale: Locale): BillSpeechLabels {
  return {
    billNo: t(locale, "billNo"),
    customer: t(locale, "customer"),
    sno: t(locale, "sno"),
    item: t(locale, "itemDescription"),
    qty: t(locale, "qty"),
    unitPrice: t(locale, "unitPrice"),
    lineTotal: t(locale, "lineTotal"),
    billTotal: t(locale, "billTotal"),
    advancePaid: t(locale, "advancePaid"),
    amountPaid: t(locale, "amountPaid"),
    pendingAmount: t(locale, "pendingAmount"),
    fullyPaid: t(locale, "fullyPaid"),
    rupees: t(locale, "rupeesSpoken"),
  };
}

export function BillReadAloudButton({
  locale,
  bill,
  compact,
  prominent,
}: {
  locale: Locale;
  bill: BillReceiptData;
  compact?: boolean;
  /** Full-width CTA above the receipt paper. */
  prominent?: boolean;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => stopBillSpeech();
  }, []);

  if (!supported) return null;

  async function toggle() {
    if (speaking) {
      stopBillSpeech();
      setSpeaking(false);
      return;
    }
    const script = buildBillReadAloudScript(bill, labelsFor(locale));
    setSpeaking(true);
    try {
      await speakBillScript(script, locale);
    } catch {
      /* unsupported / interrupted */
    } finally {
      setSpeaking(false);
    }
  }

  const label = speaking ? t(locale, "stopReadingBill") : t(locale, "readBillAloud");

  if (prominent) {
    return (
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={label}
        title={t(locale, "readBillAloudHint")}
        className={`inline-flex w-full max-w-md items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-md ${
          speaking
            ? "bg-red-600 text-white"
            : "bg-brand-green text-white"
        }`}
      >
        {speaking ? <Square className="h-5 w-5 shrink-0" /> : <Volume2 className="h-5 w-5 shrink-0" />}
        <span>{label}</span>
      </button>
    );
  }

  // Compact toolbar: icon-only so it always fits next to Share.
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={label}
        title={t(locale, "readBillAloudHint")}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
          speaking ? "bg-red-600 text-white" : "bg-brand-green text-white"
        }`}
      >
        {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-label={label}
      title={t(locale, "readBillAloudHint")}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-green/25 bg-white px-4 py-2 text-sm font-bold text-brand-green shadow-sm"
    >
      {speaking ? <Square className="h-4 w-4 shrink-0" /> : <Volume2 className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
    </button>
  );
}
