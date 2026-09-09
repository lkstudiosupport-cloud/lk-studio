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
}: {
  locale: Locale;
  bill: BillReceiptData;
  compact?: boolean;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

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
  const className = compact
    ? "inline-flex shrink-0 items-center gap-1 rounded-xl border border-brand-green/25 bg-white px-2.5 py-2 text-xs font-bold text-brand-green shadow-sm"
    : "inline-flex items-center gap-2 rounded-xl border border-brand-green/25 bg-white px-4 py-2 text-sm font-bold text-brand-green shadow-sm";

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-label={label}
      title={t(locale, "readBillAloudHint")}
      className={className}
    >
      {speaking ? <Square className="h-4 w-4 shrink-0" /> : <Volume2 className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
    </button>
  );
}
