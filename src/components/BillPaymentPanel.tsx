"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useSwipeNavBlock } from "@/hooks/useSwipeTabs";
import { CheckCircle2, ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/bill-items";
import { billPending } from "@/lib/bill-payment";
import { recordBillPayment } from "@/app/shop/actions";
import { currentMonthValue } from "@/lib/bill-list-filter";

export function BillPaymentPanel({
  billId,
  amount,
  advancePaid,
  paidAmount,
  paid,
  locale,
  compact,
  collapsibleOnMobile,
}: {
  billId: string;
  amount: number;
  advancePaid: number;
  paidAmount: number;
  paid: boolean;
  locale: Locale;
  compact?: boolean;
  /** Collapse payment form on mobile so receipt stays primary. */
  collapsibleOnMobile?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useSwipeNavBlock(true);

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 639px)").matches);
  }, []);

  const balance = billPending(amount, advancePaid, paidAmount);
  const fullyPaid = paid && balance <= 0.01;
  const useCollapsible = collapsibleOnMobile !== false && isMobile && !compact;

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
        const result = await recordBillPayment(fd);
        setPaymentAmount("");
        if (markFull || result?.paid) {
          router.push(
            `/shop/bills?tab=paid&mode=month&period=${encodeURIComponent(currentMonthValue())}`
          );
        } else {
          router.refresh();
        }
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

  const paymentForm = (
    <>
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
          <div className="bill-payment-amount-field flex min-w-0 overflow-hidden rounded-xl border border-brand-green/15 bg-white shadow-sm transition focus-within:border-brand-gold focus-within:ring-2 focus-within:ring-brand-gold/30">
            <span
              className="flex shrink-0 items-center border-r border-brand-green/10 bg-brand-cream/60 px-3 text-base font-semibold text-brand-green sm:text-sm"
              aria-hidden
            >
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              placeholder=""
              value={paymentAmount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d.]/g, "");
                const dot = raw.indexOf(".");
                const sanitized =
                  dot === -1 ? raw : `${raw.slice(0, dot + 1)}${raw.slice(dot + 1).replace(/\./g, "")}`;
                setPaymentAmount(sanitized);
              }}
              className="bill-payment-amount-input min-h-11 min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-base text-brand-green focus:outline-none sm:text-sm"
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
    </>
  );

  if (useCollapsible) {
    return (
      <div className="bill-payment-panel bill-payment-panel--collapsible card-premium overflow-visible">
        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          className="bill-payment-panel-toggle flex w-full items-center justify-between gap-3 p-4 text-left"
          aria-expanded={mobileExpanded}
        >
          <div className="min-w-0">
            <p className="font-bold text-brand-green">{t(locale, "recordCustomerPayment")}</p>
            <p className="mt-0.5 text-sm text-zinc-600">
              {t(locale, "pendingAmount")}: ₹{formatMoney(balance)}
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-brand-green transition-transform ${
              mobileExpanded ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
        {mobileExpanded && <div className="bill-payment-panel-body space-y-4 px-4 pb-4">{paymentForm}</div>}
      </div>
    );
  }

  return <div className="bill-payment-panel card-premium space-y-4 overflow-visible p-4">{paymentForm}</div>;
}
