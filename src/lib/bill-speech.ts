import { parseBillItems, formatMoney } from "@/lib/bill-items";
import { billPending } from "@/lib/bill-payment";
import type { BillReceiptData } from "@/lib/bill-receipt-text";
import type { Locale } from "@/lib/i18n/locales";
import { speechLocaleFor } from "@/lib/voice-recorder";

export type BillSpeechLabels = {
  billNo: string;
  customer: string;
  sno: string;
  item: string;
  qty: string;
  unitPrice: string;
  lineTotal: string;
  billTotal: string;
  advancePaid: string;
  amountPaid: string;
  pendingAmount: string;
  fullyPaid: string;
  rupees: string;
};

/** Build a spoken script: S.No, item, qty, price, line total, then overall total. */
export function buildBillReadAloudScript(
  bill: BillReceiptData,
  labels: BillSpeechLabels
): string {
  const items = parseBillItems(bill.itemsJson, bill.amount);
  const rows =
    items.length > 0
      ? items
      : [{ id: "t", name: labels.billTotal, quantity: 1, price: bill.amount, amount: bill.amount }];
  const pending = billPending(bill.amount, bill.advancePaid, bill.paidAmount);
  const parts: string[] = [];

  parts.push(`${labels.billNo} ${bill.billNumber}.`);
  parts.push(`${labels.customer} ${bill.customer.name}.`);

  rows.forEach((item, idx) => {
    parts.push(
      [
        `${labels.sno} ${idx + 1}.`,
        `${labels.item} ${item.name}.`,
        `${labels.qty} ${item.quantity}.`,
        `${labels.unitPrice} ${formatMoney(item.price)} ${labels.rupees}.`,
        `${labels.lineTotal} ${formatMoney(item.amount)} ${labels.rupees}.`,
      ].join(" ")
    );
  });

  parts.push(`${labels.billTotal} ${formatMoney(bill.amount)} ${labels.rupees}.`);
  parts.push(`${labels.advancePaid} ${formatMoney(bill.advancePaid)} ${labels.rupees}.`);
  parts.push(`${labels.amountPaid} ${formatMoney(bill.paidAmount)} ${labels.rupees}.`);
  parts.push(`${labels.pendingAmount} ${formatMoney(pending)} ${labels.rupees}.`);
  if (bill.paid && pending <= 0.01) {
    parts.push(labels.fullyPaid);
  }

  return parts.join(" ");
}

export function stopBillSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function isBillSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && !!window.speechSynthesis;
}

function pickVoiceForLocale(
  voices: SpeechSynthesisVoice[],
  locale: Locale
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const lang = speechLocaleFor(locale).toLowerCase();
  const exact = voices.find((v) => v.lang.toLowerCase() === lang);
  if (exact) return exact;
  const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
  if (prefix) return prefix;
  const en = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return en ?? voices[0] ?? null;
}

/**
 * Must call speak() inside the user-gesture stack (no awaits before speak).
 * Android WebView blocks speech started after async gaps.
 */
export function speakBillScript(text: string, locale: Locale): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.reject(new Error("Speech not supported"));
  }

  const synth = window.speechSynthesis;
  try {
    synth.cancel();
  } catch {
    /* ignore */
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = speechLocaleFor(locale);
  utter.rate = 0.92;
  const voice = pickVoiceForLocale(synth.getVoices(), locale);
  if (voice) utter.voice = voice;

  return new Promise<void>((resolve, reject) => {
    let finished = false;
    const done = (ok: boolean, err?: Error) => {
      if (finished) return;
      finished = true;
      window.clearInterval(keepAlive);
      if (ok) resolve();
      else reject(err ?? new Error("Speech failed"));
    };

    utter.onend = () => done(true);
    utter.onerror = (event) => {
      const code = event.error;
      if (code === "interrupted" || code === "canceled") {
        done(true);
        return;
      }
      done(false, new Error(code || "Speech failed"));
    };

    // Speak immediately while still in the tap gesture.
    synth.speak(utter);
    try {
      synth.resume();
    } catch {
      /* ignore */
    }

    // Some Android builds never fire onstart/onend if the engine is paused.
    window.setTimeout(() => {
      try {
        if (synth.paused) synth.resume();
        if (!synth.speaking && !synth.pending && !finished) {
          // Engine dropped the utterance — retry once with default voice.
          try {
            synth.cancel();
          } catch {
            /* ignore */
          }
          const retry = new SpeechSynthesisUtterance(text);
          retry.lang = "en-IN";
          retry.rate = 0.92;
          retry.onend = () => done(true);
          retry.onerror = () => done(false, new Error("Speech failed"));
          synth.speak(retry);
          try {
            synth.resume();
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    }, 400);

    const keepAlive = window.setInterval(() => {
      try {
        if (synth.speaking || synth.pending) synth.resume();
      } catch {
        /* ignore */
      }
    }, 5000);
  });
}
