"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSwipeNavBlock } from "@/hooks/useSwipeTabs";
import { CheckCircle2, IndianRupee } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/bill-items";
import { billPending } from "@/lib/bill-payment";
import { recordBillPayment } from "@/app/shop/actions";

export function BillPaymentPanel({
  billId,
  amount,
  advancePaid,
  paidAmount,
  paid,
  locale,
  compact,
}: {
  billId: string;
  amount: number;
  advancePaid: number;
  paidAmount: number;
  paid: boolean;
  locale: Locale;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  useSwipeNavBlock(true);

  const balance = billPending(amount, advancePaid, paidAmount);
  const fullyPaid = paid && balance <= 0.01;

  if (fullyPaid) {
    return (
      <div
        className={`bill-payment-panel flex items-center gap-2 rounded-xl bg-emerald-600 text-white ${
          compact ? "px-3 py-2 text-sm font-semibold" : "px-4 py-3 font-semibold"
        }`}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {t(locale, "fullyPaid")}
      </div>
    );
  }

  function submit(markFull: boolean) {
    setError("");
    const fd = new FormData();
    fd.set("billId", billId);
    fd.set("markFull", markFull ? "true" : "false");
    if (!markFull) fd.set("amount", paymentAmount);

    startTransition(async () => {
      try {
        await recordBillPayment(fd);
        setPaymentAmount("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t(locale, "paymentRecordFailed"));
      }
    });
  }

  if (compact) {
    return (
      <div className="bill-payment-panel border-t border-brand-green/10 bg-brand-cream/50 p-3">
        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            submit(true);
          }}
          className="btn-primary w-full py-2 text-sm disabled:opacity-60"
        >
          {pending ? "…" : t(locale, "markBillPaid")}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bill-payment-panel card-premium space-y-4 p-4">
      <div>
        <h2 className="font-bold text-brand-green">{t(locale, "recordCustomerPayment")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "recordCustomerPaymentHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-brand-cream/80 p-3 text-center">
          <p className="text-xs text-zinc-500">{t(locale, "billTotal")}</p>
          <p className="font-bold text-brand-green">₹{formatMoney(amount)}</p>
        </div>
        <div className="rounded-xl bg-brand-cream/80 p-3 text-center">
          <p className="text-xs text-zinc-500">{t(locale, "advancePaid")}</p>
          <p className="font-bold text-amber-700">₹{formatMoney(advancePaid)}</p>
        </div>
        <div className="rounded-xl bg-brand-cream/80 p-3 text-center">
          <p className="text-xs text-zinc-500">{t(locale, "amountPaid")}</p>
          <p className="font-bold text-emerald-700">₹{formatMoney(paidAmount)}</p>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 text-center">
          <p className="text-xs text-zinc-500">{t(locale, "pendingAmount")}</p>
          <p className="font-bold text-rose-700">₹{formatMoney(balance)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-semibold text-brand-green">
            {t(locale, "paymentAmountNow")}
          </span>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={formatMoney(balance)}
              className="input-premium w-full pl-9"
            />
          </div>
        </label>
        <button
          type="button"
          disabled={pending || !paymentAmount}
          onClick={() => submit(false)}
          className="rounded-xl border border-brand-green/20 bg-white px-4 py-2.5 text-sm font-semibold text-brand-green disabled:opacity-50"
        >
          {pending ? "…" : t(locale, "recordPartialPayment")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className="btn-primary px-4 py-2.5 text-sm disabled:opacity-60"
        >
          {pending ? "…" : t(locale, "markBillPaid")}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
