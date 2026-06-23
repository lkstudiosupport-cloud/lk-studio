"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { ShopOrderCard } from "@/components/ShopOrderCard";
import { ShopPriceRequestsPanel } from "@/components/ShopPriceRequestsPanel";
import type { ShopOrderData } from "@/lib/shop-order-types";
import type { ShopOrderTabCounts } from "@/lib/order-stats";
import type { ShopPriceRequestRow } from "@/lib/shop-price-request-types";
import { useSwipeTabs } from "@/hooks/useSwipeTabs";

const ORDER_STATUS_TABS = [
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
] as const;

const PRICE_QUOTES_TAB = {
  id: "price-quotes",
  labelKey: "ordersPriceQuotesTab",
  countKey: "priceQuotesPending" as const,
} as const;

const TAB_IDS = [...ORDER_STATUS_TABS.map((s) => s.id), PRICE_QUOTES_TAB.id];

function tabFromParam(value: string | null): string {
  if (value && TAB_IDS.includes(value)) return value;
  return "pending";
}

export function ShopOrdersPanel({
  locale,
  orders,
  priceRequests,
  tabCounts,
  listHint,
}: {
  locale: Locale;
  orders: ShopOrderData[];
  priceRequests: ShopPriceRequestRow[];
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

  const activeOrderTab = ORDER_STATUS_TABS.find((s) => s.id === tab);

  const filteredOrders = useMemo(() => {
    if (!activeOrderTab) return [];
    return orders.filter((o) => activeOrderTab.statuses.includes(o.status));
  }, [orders, activeOrderTab]);

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
        {ORDER_STATUS_TABS.map((s) => (
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
        <button
          type="button"
          onClick={() => selectTab(PRICE_QUOTES_TAB.id)}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
            tab === PRICE_QUOTES_TAB.id
              ? "bg-brand-green text-brand-gold"
              : "bg-white text-brand-green ring-1 ring-brand-green/15"
          }`}
        >
          {t(locale, PRICE_QUOTES_TAB.labelKey)}
          <span className="ml-1 opacity-80">({tabCounts[PRICE_QUOTES_TAB.countKey]})</span>
        </button>
      </div>

      <div
        className="space-y-6 touch-pan-y"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        {tab === PRICE_QUOTES_TAB.id ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">{t(locale, "priceRequestsHint")}</p>
            <ShopPriceRequestsPanel locale={locale} requests={priceRequests} />
          </div>
        ) : (
          <>
            {filteredOrders.map((o) => (
              <ShopOrderCard
                key={o.id}
                order={o}
                locale={locale}
                onStatusUpdated={handleStatusUpdated}
              />
            ))}
            {filteredOrders.length === 0 && (
              <p className="card-premium p-8 text-center text-zinc-500">{t(locale, "noData")}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
