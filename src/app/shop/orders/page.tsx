import { prisma } from "@/lib/prisma";
import { t } from "@/lib/i18n";
import { ShopOrdersPanel } from "@/components/ShopOrdersPanel";
import { shopOrderTabCounts } from "@/lib/order-stats";
import { LIST_PAGE_SIZE } from "@/lib/limits";
import { cachedLocale, cachedShopSession } from "@/lib/cached-server";
import { withDbRetry } from "@/lib/safe-db";
import { ServerRetryPanel } from "@/components/ServerRetryPanel";
import Link from "next/link";

export default async function ShopOrdersPage() {
  const session = await cachedShopSession();
  const locale = await cachedLocale();
  const shopId = session!.shopId!;

  try {
    const [orders, priceRequests, tabCounts, totalActive] = await withDbRetry(() =>
      Promise.all([
        prisma.order.findMany({
          where: { shopId, status: { not: "CANCELLED" } },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            person: { include: { measurements: true } },
            design: { select: { id: true, title: true, imagePath: true, category: true } },
            orderFavorites: {
              include: {
                design: { select: { id: true, title: true, imagePath: true, category: true } },
              },
            },
            images: { orderBy: { createdAt: "asc" }, take: 8 },
          },
          orderBy: { createdAt: "desc" },
          take: LIST_PAGE_SIZE,
        }),
        prisma.priceRequest.findMany({
          where: { shopId },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            design: { select: { id: true, title: true, imagePath: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        shopOrderTabCounts(shopId),
        prisma.order.count({ where: { shopId, status: { not: "CANCELLED" } } }),
      ])
    );
    const truncated = totalActive > orders.length;

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
            truncated ? t(locale, "showingLatestOrders").replace("{n}", String(LIST_PAGE_SIZE)) : undefined
          }
        />
      </>
    );
  } catch (err) {
    console.error("[lk-studio] shop orders error:", err);
    return <ServerRetryPanel locale={locale} />;
  }
}
