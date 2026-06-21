import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { billPending } from "@/lib/bill-payment";
import { Receipt, ClipboardList, ChevronRight } from "lucide-react";

export default async function CustomerHome() {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const [orders, bills] = await Promise.all([
    prisma.order.count({ where: { customerId: session!.id } }),
    prisma.bill.findMany({ where: { customerId: session!.id } }),
  ]);

  const totalPending = bills.reduce(
    (s, b) => s + billPending(b.amount, b.advancePaid, b.paidAmount),
    0
  );
  const totalBillAmount = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t(locale, "dashboard")}</h1>
      <p className="text-sm text-zinc-600">{t(locale, "customerDashboardHint")}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/customer/orders"
          className="card-premium block p-4 text-center transition hover:shadow-lg active:scale-[0.99]"
        >
          <ClipboardList className="mx-auto h-8 w-8 text-brand-green" />
          <p className="mt-2 text-2xl font-bold">{orders}</p>
          <p className="text-sm font-semibold text-brand-green">{t(locale, "myOrders")}</p>
          <p className="mt-2 flex items-center justify-center gap-0.5 text-xs font-medium text-brand-gold-dark">
            {t(locale, "viewMyOrders")}
            <ChevronRight className="h-3.5 w-3.5" />
          </p>
        </Link>

        <Link
          href="/customer/bills"
          className="card-premium block p-4 text-center transition hover:shadow-lg active:scale-[0.99]"
        >
          <Receipt className="mx-auto h-8 w-8 text-brand-gold-dark" />
          <p className="mt-2 text-2xl font-bold">{bills.length}</p>
          <p className="text-sm font-semibold text-brand-green">{t(locale, "myBills")}</p>
          <p className="mt-2 flex items-center justify-center gap-0.5 text-xs font-medium text-brand-gold-dark">
            {t(locale, "viewMyBills")}
            <ChevronRight className="h-3.5 w-3.5" />
          </p>
        </Link>

        <Link
          href="/customer/bills"
          className="card-premium block p-4 text-center transition hover:shadow-lg active:scale-[0.99]"
        >
          <p className="mt-2 text-2xl font-bold text-brand-green">₹{totalBillAmount.toFixed(0)}</p>
          <p className="text-sm font-semibold text-brand-green">{t(locale, "billTotal")}</p>
          {totalPending > 0 ? (
            <p className="mt-1 text-xs font-medium text-rose-700">
              {t(locale, "pendingAmount")}: ₹{totalPending.toFixed(0)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">{t(locale, "viewMyBills")}</p>
          )}
        </Link>
      </div>
    </div>
  );
}
