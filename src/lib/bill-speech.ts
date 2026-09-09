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

export function speakBillScript(text: string, locale: Locale): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Speech not supported"));
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = speechLocaleFor(locale);
    utter.rate = 0.95;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const lang = speechLocaleFor(locale).toLowerCase();
      const exact = voices.find((v) => v.lang.toLowerCase() === lang);
      const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
      utter.voice = exact ?? prefix ?? null;
    };

    pickVoice();
    if (!utter.voice && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", pickVoice, { once: true });
    }

    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("Speech failed"));
    window.speechSynthesis.speak(utter);
  });
}
