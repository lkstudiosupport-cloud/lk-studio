"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { BillCard } from "@/components/BillCard";
import type { BillsDateMode, BillsTab } from "@/lib/bill-list-filter";
import {
  currentDayValue,
  currentMonthValue,
  formatBillsPeriodLabel,
} from "@/lib/bill-list-filter";

type BillRow = {
  id: string;
  billNumber: string;
  amount: number;
  advancePaid: number;
  paidAmount: number;
  paid: boolean;
  itemsJson: string;
  notes: string | null;
  createdAt: Date | string;
  displayName: string;
};

export function ShopBillsPanel({
  locale,
  tab,
  mode,
  period,
  periodLabel,
  bills,
  total,
  counts,
}: {
  locale: Locale;
  tab: BillsTab;
  mode: BillsDateMode;
  period: string;
  periodLabel: string;
  bills: BillRow[];
  total: number;
  counts: { all: number; pending: number; paid: number };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function navigate(next: Partial<{ tab: BillsTab; mode: BillsDateMode; period: string }>) {
    const params = new URLSearchParams();
    const nextTab = next.tab ?? tab;
    params.set("tab", nextTab);

    if (nextTab === "paid") {
      const nextMode = next.mode ?? mode;
      params.set("mode", nextMode);
      let nextPeriod = next.period ?? period;
      if (next.mode && next.mode !== mode) {
        nextPeriod = next.mode === "day" ? currentDayValue() : currentMonthValue();
      }
      params.set("period", nextPeriod);
    }

    startTransition(() => {
      router.push(`/shop/bills?${params.toString()}`);
    });
  }

  const tabs: { id: BillsTab; label: string; count: number; small?: boolean }[] = [
    { id: "all", label: t(locale, "billsTabAll"), count: counts.all },
    { id: "pending", label: t(locale, "billsTabPending"), count: counts.pending },
    { id: "paid", label: t(locale, "billsTabPaid"), count: counts.paid, small: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{t(locale, "bills")}</h1>
        <Link
          href="/shop/bills/new"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t(locale, "createBill")}
        </Link>
      </div>

      <div className="scroll-nav -mx-1 flex gap-2 px-1 pb-1">
        {tabs.map(({ id, label, count, small }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate({ tab: id })}
            className={`shrink-0 whitespace-nowrap rounded-full font-semibold ring-1 ring-brand-green/15 transition ${
              small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
            } ${
              tab === id
                ? "bg-brand-green text-brand-gold ring-brand-green"
                : "bg-white text-brand-green hover:bg-brand-cream/80"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-80">({count})</span>
          </button>
        ))}
      </div>

      {tab === "paid" && (
        <div className="card-premium space-y-3 p-4">
          <p className="text-sm text-zinc-600">{t(locale, "billsPaidFolderHint")}</p>
          <div className="flex flex-wrap gap-2">
            {(["month", "day"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => navigate({ mode: m })}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                  mode === m
                    ? "bg-brand-green text-brand-gold"
                    : "bg-brand-cream text-brand-green ring-1 ring-brand-green/15"
                }`}
              >
                {t(locale, m === "month" ? "billsFilterMonth" : "billsFilterDay")}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-brand-green-soft">
              {t(locale, mode === "month" ? "billsPickMonth" : "billsPickDay")}
            </span>
            <input
              type={mode === "month" ? "month" : "date"}
              value={period}
              onChange={(e) => e.target.value && navigate({ period: e.target.value })}
              className="input-premium w-full max-w-xs"
            />
          </label>
          <p className="text-sm font-medium text-brand-green">{periodLabel}</p>
        </div>
      )}

      {tab === "pending" && (
        <p className="text-sm text-zinc-600">{t(locale, "billsPendingHint")}</p>
      )}

      <div className="space-y-4">
        {bills.map((b) => (
          <BillCard
            key={b.id}
            bill={b}
            locale={locale}
            href={`/shop/bills/${b.id}`}
            editHref={`/shop/bills/${b.id}/edit`}
            shopMode={tab !== "paid"}
          />
        ))}
        {bills.length === 0 && (
          <div className="card-premium space-y-4 p-8 text-center">
            <p className="text-zinc-600">
              {tab === "paid"
                ? t(locale, "noPaidBills")
                : tab === "pending"
                  ? t(locale, "noPendingBills")
                  : t(locale, "noBills")}
            </p>
            {tab === "all" && (
              <Link
                href="/shop/bills/new"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                {t(locale, "createBill")}
              </Link>
            )}
          </div>
        )}
      </div>

      {total > bills.length && (
        <p className="text-center text-xs text-zinc-500">
          {t(locale, "showingLatestBills").replace("{n}", String(bills.length))}
        </p>
      )}
    </div>
  );
}
