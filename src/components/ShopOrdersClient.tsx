"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";
import { ShopOrdersPanel } from "@/components/ShopOrdersPanel";
import { useShopTabData } from "@/hooks/useShopTabData";

export function ShopOrdersClient({ locale }: { locale: Locale }) {
  const { data, loading, error, refresh } = useShopTabData("orders");

  if (loading && !data) return <PageLoadingSkeleton />;
  if (error && !data) {
    return (
      <div className="card-premium mx-auto max-w-md space-y-4 p-6 text-center">
        <h2 className="text-lg font-bold text-brand-green">{t(locale, "serverTemporaryErrorTitle")}</h2>
        <p className="text-sm text-zinc-600">{t(locale, "serverTemporaryErrorHint")}</p>
        <button type="button" className="btn-primary w-full py-3" onClick={() => void refresh()}>
          {t(locale, "tryAgain")}
        </button>
      </div>
    );
  }
  if (!data) return <PageLoadingSkeleton />;

  return (
    <>
      <div className="scroll-nav -mx-1 mb-4 flex flex-wrap justify-end gap-2 overflow-x-auto px-1">
        <Link
          href="/shop/orders/new"
          className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-brand-gold"
        >
          {t(locale, "newShopOrder")}
        </Link>
      </div>
      <ShopOrdersPanel
        locale={locale}
        orders={data.orders}
        priceRequests={data.priceRequests}
        tabCounts={data.tabCounts}
        listHint={
          data.truncated
            ? t(locale, "showingLatestOrders").replace("{n}", String(data.pageSize))
            : undefined
        }
        onRefresh={() => void refresh()}
      />
    </>
  );
}
