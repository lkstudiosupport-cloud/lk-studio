"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { ShopOrderCard } from "@/components/ShopOrderCard";
import type { ShopOrderData } from "@/components/ShopOrderCard";
import type { ShopOrderTabCounts } from "@/lib/order-stats";
import { useSwipeTabs } from "@/hooks/useSwipeTabs";

const STATUS_TABS = [
  {
    id: "pending",
    labelKey: "status.pending",
    statuses: ["PENDING", "MEASURING", "STITCHING"] as OrderStatus[],
    countKey: "pending" as const,
  },
  {
    id: "ready",
    labelKey: "status.readyToPick",
    statuses: ["READY"] as OrderStatus[],
    countKey: "ready" as const,
  },
  {
    id: "completed",
    labelKey: "dashboardCompleted",
    statuses: ["DELIVERED"] as OrderStatus[],
    countKey: "completed" as const,
  },
];

const TAB_IDS = STATUS_TABS.map((s) => s.id);

function tabFromParam(value: string | null): string {
  if (value && TAB_IDS.includes(value)) return value;
  return "pending";
}

export function ShopOrdersPanel({
  locale,
  orders,
  tabCounts,
  listHint,
}: {
  locale: Locale;
  orders: ShopOrderData[];
  tabCounts: ShopOrderTabCounts;
  listHint?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState(() => tabFromParam(tabParam));

  useEffect(() => {
    setTab(tabFromParam(tabParam));
  }, [tabParam]);

  const selectTab = useCallback(
    (id: string) => {
      setTab(id);
      router.replace(`/shop/orders?tab=${id}`, { scroll: false });
    },
    [router]
  );

  const active = STATUS_TABS.find((s) => s.id === tab)!;

  const filtered = useMemo(() => {
    return orders.filter((o) => active.statuses.includes(o.status));
  }, [orders, active]);

  const swipe = useSwipeTabs(TAB_IDS, tab, selectTab);

  const handleStatusUpdated = useCallback(
    (tabId: string) => {
      selectTab(tabId);
    },
    [selectTab]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "orders")}</h1>
        {listHint && <p className="mt-1 text-xs text-zinc-500">{listHint}</p>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => selectTab(s.id)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
              tab === s.id
                ? "bg-brand-green text-brand-gold"
                : "bg-white text-brand-green ring-1 ring-brand-green/15"
            }`}
          >
            {t(locale, s.labelKey)}
            <span className="ml-1 opacity-80">({tabCounts[s.countKey]})</span>
          </button>
        ))}
      </div>

      <div
        className="space-y-6 touch-pan-y"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        {filtered.map((o) => (
          <ShopOrderCard
            key={o.id}
            order={o}
            locale={locale}
            onStatusUpdated={handleStatusUpdated}
          />
        ))}
        {filtered.length === 0 && (
          <p className="card-premium p-8 text-center text-zinc-500">{t(locale, "noData")}</p>
        )}
      </div>
    </div>
  );
}
