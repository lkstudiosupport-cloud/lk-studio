import { t } from "@/lib/i18n";
import { ShopOrdersPanel } from "@/components/ShopOrdersPanel";
import { SHOP_ORDERS_PAGE_SIZE } from "@/lib/limits";
import { cachedLocale, cachedShopSession } from "@/lib/cached-server";
import { getCachedShopOrdersPage } from "@/lib/cached-shop-data";
import { withDbRetry } from "@/lib/safe-db";
import { ServerRetryPanel } from "@/components/ServerRetryPanel";
import Link from "next/link";

export default async function ShopOrdersPage() {
  const session = await cachedShopSession();
  const locale = await cachedLocale();
  const shopId = session!.shopId!;

  try {
    const { orders, priceRequests, tabCounts } = await withDbRetry(() =>
      getCachedShopOrdersPage(shopId)
    );
    const truncated = orders.length >= SHOP_ORDERS_PAGE_SIZE;

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
          orders={orders}
          priceRequests={priceRequests}
          tabCounts={tabCounts}
          listHint={
            truncated
              ? t(locale, "showingLatestOrders").replace("{n}", String(SHOP_ORDERS_PAGE_SIZE))
              : undefined
          }
        />
      </>
    );
  } catch (err) {
    console.error("[lk-studio] shop orders error:", err);
    return <ServerRetryPanel locale={locale} />;
  }
}
