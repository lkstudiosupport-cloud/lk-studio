"use client";

import Link from "next/link";
import { IndianRupee, TrendingUp } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import type { ServiceCategory } from "@prisma/client";
import { orderStatusTabId } from "@/lib/order-stats";

export type DashboardOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  category: ServiceCategory;
  customerName: string;
  personName: string;
  designTitle: string | null;
};

const STATUS_TABS = [
  { id: "pending", labelKey: "status.pending" },
  { id: "stitching", labelKey: "status.stitching" },
  { id: "ready", labelKey: "status.ready" },
  { id: "completed", labelKey: "dashboardCompleted" },
] as const;

export function ShopDashboard({
  locale,
  orders,
  weeklyIncome,
  monthlyIncome,
  statusCounts,
}: {
  locale: Locale;
  orders: DashboardOrder[];
  weeklyIncome: number;
  monthlyIncome: number;
  statusCounts: {
    pending: number;
    stitching: number;
    ready: number;
    completed: number;
  };
}) {
  return (
    <div className="space-y-6">
      <h1 className="page-title">{t(locale, "dashboard")}</h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/shop/reports?mode=week"
          className="card-premium block p-4 transition hover:shadow-lg sm:p-5"
        >
          <p className="flex items-center gap-1 text-xs font-semibold uppercase text-brand-green-soft sm:text-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            {t(locale, "weeklyIncome")}
          </p>
          <p className="mt-2 flex items-center text-2xl font-bold text-brand-green sm:text-3xl">
            <IndianRupee className="h-6 w-6 text-brand-gold sm:h-7 sm:w-7" />
            {weeklyIncome.toFixed(0)}
          </p>
          <p className="mt-2 text-xs font-medium text-brand-gold-dark">{t(locale, "viewEarningsReport")}</p>
        </Link>
        <Link
          href="/shop/reports?mode=month"
          className="card-premium block p-4 transition hover:shadow-lg sm:p-5"
        >
          <p className="flex items-center gap-1 text-xs font-semibold uppercase text-brand-green-soft sm:text-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            {t(locale, "monthlyIncome")}
          </p>
          <p className="mt-2 flex items-center text-2xl font-bold text-brand-green sm:text-3xl">
            <IndianRupee className="h-6 w-6 text-brand-gold sm:h-7 sm:w-7" />
            {monthlyIncome.toFixed(0)}
          </p>
          <p className="mt-2 text-xs font-medium text-brand-gold-dark">{t(locale, "viewEarningsReport")}</p>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/shop/orders?tab=${tab.id}`}
            className="rounded-2xl bg-white px-3 py-5 text-center text-sm font-bold text-brand-green shadow-md ring-1 ring-brand-green/15 transition hover:shadow-lg active:scale-[0.98] sm:py-5 sm:text-base"
          >
            <span className="block leading-tight">{t(locale, tab.labelKey)}</span>
            <span className="mt-1 inline-block rounded-full bg-brand-cream px-2 py-0.5 text-xs text-brand-green">
              {statusCounts[tab.id] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/shop/orders?tab=${orderStatusTabId(order.status)}`}
            className="card-premium block p-4 transition hover:shadow-lg"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold text-brand-green">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {order.customerName} · {order.personName}
                </p>
                {order.designTitle && (
                  <p className="text-sm text-zinc-500">{order.designTitle}</p>
                )}
              </div>
              <span className="rounded-full bg-brand-cream px-2.5 py-1 text-xs font-semibold text-brand-green">
                {t(locale, categoryLabelKey(order.category))}
              </span>
            </div>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="card-premium p-6 text-center text-sm text-zinc-500">{t(locale, "noData")}</p>
        )}
      </div>
    </div>
  );
}
