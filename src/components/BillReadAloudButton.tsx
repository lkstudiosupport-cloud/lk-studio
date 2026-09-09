"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  floating,
}: {
  locale: Locale;
  bill: BillReceiptData;
  compact?: boolean;
  /** Full-width CTA above the receipt paper. */
  prominent?: boolean;
  /** Fixed floating control — always on screen on the bill page. */
  floating?: boolean;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => stopBillSpeech();
  }, []);

  async function toggle() {
    setError("");
    if (speaking) {
      stopBillSpeech();
      setSpeaking(false);
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError(t(locale, "readBillNotSupported"));
      return;
    }
    const script = buildBillReadAloudScript(bill, labelsFor(locale));
    setSpeaking(true);
    try {
      // Some Android WebViews need a warm-up cancel before the first speak.
      window.speechSynthesis.cancel();
      await speakBillScript(script, locale);
    } catch {
      setError(t(locale, "readBillNotSupported"));
    } finally {
      setSpeaking(false);
    }
  }

  const label = speaking ? t(locale, "stopReadingBill") : t(locale, "readBillAloud");
  const hint = t(locale, "readBillAloudHint");

  if (floating) {
    if (!mounted) return null;
    const ui = (
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[80] flex justify-center px-3 print:hidden">
        <div className="pointer-events-auto flex max-w-md flex-col items-stretch gap-1">
          <button
            type="button"
            onClick={() => void toggle()}
            aria-label={label}
            title={hint}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-lg ${
              speaking ? "bg-red-600 text-white" : "bg-brand-green text-brand-gold"
            }`}
          >
            {speaking ? <Square className="h-5 w-5 shrink-0" /> : <Volume2 className="h-5 w-5 shrink-0" />}
            <span>{label}</span>
          </button>
          {error ? <p className="rounded-lg bg-white/95 px-3 py-1 text-center text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    );
    return createPortal(ui, document.body);
  }

  if (prominent) {
    return (
      <div className="flex w-full max-w-md flex-col items-stretch gap-1">
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={label}
          title={hint}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-md ${
            speaking ? "bg-red-600 text-white" : "bg-brand-green text-white"
          }`}
        >
          {speaking ? <Square className="h-5 w-5 shrink-0" /> : <Volume2 className="h-5 w-5 shrink-0" />}
          <span>{label}</span>
        </button>
        {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={label}
        title={hint}
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
      title={hint}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-green/25 bg-white px-4 py-2 text-sm font-bold text-brand-green shadow-sm"
    >
      {speaking ? <Square className="h-4 w-4 shrink-0" /> : <Volume2 className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
    </button>
  );
}
