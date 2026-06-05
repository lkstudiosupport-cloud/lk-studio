import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { parseBillItems, formatMoney, formatBillLineSummary } from "@/lib/bill-items";
import { billPending } from "@/lib/bill-payment";
import { BillPaymentPanel } from "@/components/BillPaymentPanel";
import { ChevronDown, ChevronRight } from "lucide-react";

type BillView = {
  id: string;
  billNumber: string;
  amount: number;
  advancePaid: number;
  paidAmount: number;
  paid: boolean;
  itemsJson: string;
  notes: string | null;
  createdAt: Date;
  shop?: { shopName: string };
  customer?: { name: string } | null;
  displayName?: string;
};

export function BillCard({
  bill,
  locale,
  showShop,
  href,
  shopMode,
}: {
  bill: BillView;
  locale: Locale;
  showShop?: boolean;
  href?: string;
  shopMode?: boolean;
}) {
  const items = parseBillItems(bill.itemsJson, bill.amount);
  const pending = billPending(bill.amount, bill.advancePaid, bill.paidAmount);
  const lineItems =
    items.length > 0
      ? items
      : [{ id: "total", name: t(locale, "billTotal"), quantity: 1, price: bill.amount, amount: bill.amount }];

  const displayName = showShop
    ? bill.shop?.shopName
    : (bill.displayName ?? bill.customer?.name ?? "—");

  const dateStr = bill.createdAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="card-premium overflow-hidden">
      <div className="brand-card-header flex flex-wrap items-start justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="font-bold">{bill.billNumber}</p>
          <p className="text-sm text-white/85">{displayName}</p>
          <p className="mt-0.5 text-xs text-white/70">{dateStr}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">₹{formatMoney(bill.amount)}</p>
          {href && (
            <Link
              href={href}
              className="mt-1 inline-flex items-center justify-end gap-0.5 text-xs font-medium text-brand-gold hover:underline"
            >
              {t(locale, "viewFullBill")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <details className="group border-t border-brand-green/10">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-brand-green [&::-webkit-details-marker]:hidden">
          {t(locale, "billOpenDetails")}
          <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
        </summary>

        <div className="border-t border-brand-green/10">
          <ul className="divide-y divide-zinc-100 px-4 py-2">
            {lineItems.map((item) => (
              <li key={item.id} className="flex justify-between py-2 text-sm">
                <span className="pr-2 line-clamp-1">{formatBillLineSummary(item)}</span>
                <span className="shrink-0 font-semibold">₹{formatMoney(item.amount)}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-1.5 border-t border-brand-green/10 bg-brand-cream/80 p-3 text-xs sm:gap-2 sm:p-4 sm:text-sm md:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-zinc-500">{t(locale, "billTotal")}</p>
              <p className="font-bold text-brand-green">₹{formatMoney(bill.amount)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">{t(locale, "advancePaid")}</p>
              <p className="font-bold text-amber-700">₹{formatMoney(bill.advancePaid)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">{t(locale, "amountPaid")}</p>
              <p className="font-bold text-emerald-700">₹{formatMoney(bill.paidAmount)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">{t(locale, "pendingAmount")}</p>
              <p className="font-bold text-rose-700">₹{formatMoney(pending)}</p>
            </div>
          </div>

          {bill.paid && pending <= 0.01 && (
            <p className="bg-emerald-600 py-2 text-center text-sm font-semibold text-white">
              {t(locale, "fullyPaid")}
            </p>
          )}
          {shopMode && pending > 0.01 && (
            <BillPaymentPanel
              billId={bill.id}
              amount={bill.amount}
              advancePaid={bill.advancePaid}
              paidAmount={bill.paidAmount}
              paid={bill.paid}
              locale={locale}
              compact
            />
          )}
        </div>
      </details>
    </article>
  );
}
