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

/** Android Chrome / Capacitor WebView often returns [] until voiceschanged. */
function waitForVoices(timeoutMs = 2500): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", onChanged);
      window.clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const onChanged = () => finish();
    synth.addEventListener("voiceschanged", onChanged);
    // Kick the engine — some WebViews populate voices only after cancel/getVoices.
    try {
      synth.cancel();
      void synth.getVoices();
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(finish, timeoutMs);
  });
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

export async function speakBillScript(text: string, locale: Locale): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    throw new Error("Speech not supported");
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const voices = await waitForVoices();
  const voice = pickVoiceForLocale(voices, locale);

  // Empty voices is common briefly on Android — still try default engine voice.
  // Only treat as hard failure when speechSynthesis itself is missing (checked above).

  await new Promise<void>((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = speechLocaleFor(locale);
    utter.rate = 0.95;
    if (voice) utter.voice = voice;

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
      // User stopped, or a new utterance replaced this one — not a hard failure.
      if (code === "interrupted" || code === "canceled") {
        done(true);
        return;
      }
      done(false, new Error(code || "Speech failed"));
    };

    synth.speak(utter);
    // Chrome / Android WebView sometimes pauses the queue until resume.
    try {
      synth.resume();
    } catch {
      /* ignore */
    }

    // Keep the utterance alive on some Chromium builds that pause after ~15s.
    const keepAlive = window.setInterval(() => {
      try {
        if (synth.speaking) synth.resume();
      } catch {
        /* ignore */
      }
    }, 8000);
  });
}
