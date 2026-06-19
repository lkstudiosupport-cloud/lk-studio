import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isShopActive } from "@/lib/subscription";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { FavoritePriceQuoteForm } from "@/components/FavoritePriceQuoteForm";
import { AskPriceOwnDesignCard } from "@/components/AskPriceForm";

export async function CustomerPriceQuoteSection({
  locale,
  customerId,
  shopIdParam,
}: {
  locale: Locale;
  customerId: string;
  shopIdParam?: string;
}) {
  const [favoriteRows, savedRows] = await Promise.all([
    prisma.customerFavorite.findMany({
      where: { customerId },
      select: { shopId: true },
      distinct: ["shopId"],
    }),
    prisma.customerSavedShop.findMany({
      where: { customerId },
      select: { shopId: true },
    }),
  ]);

  const shopIds = [
    ...new Set([...favoriteRows.map((r) => r.shopId), ...savedRows.map((r) => r.shopId)]),
  ];

  if (shopIds.length === 0) {
    return (
      <div className="card-premium space-y-3 p-6 text-center">
        <p className="text-sm text-zinc-600">{t(locale, "priceQuotePickShopHint")}</p>
        <Link href="/customer/shops" className="btn-primary inline-flex px-5 py-2.5 text-sm">
          {t(locale, "browseShops")}
        </Link>
      </div>
    );
  }

  const shops = await prisma.shopProfile.findMany({
    where: { id: { in: shopIds } },
    select: {
      id: true,
      shopName: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
    },
    orderBy: { shopName: "asc" },
  });

  const activeShops = shops.filter((s) =>
    isShopActive(s.subscriptionStatus, s.subscriptionEndsAt)
  );

  if (activeShops.length === 0) {
    return (
      <div className="card-premium p-6 text-center text-sm text-zinc-600">
        {t(locale, "shopUnavailable")}
      </div>
    );
  }

  const selectedShopId =
    shopIdParam && activeShops.some((s) => s.id === shopIdParam)
      ? shopIdParam
      : activeShops[0]!.id;

  const selectedShop = activeShops.find((s) => s.id === selectedShopId)!;

  const favorites = await prisma.customerFavorite.findMany({
    where: { customerId, shopId: selectedShopId },
    include: {
      design: {
        select: {
          id: true,
          title: true,
          imagePath: true,
        },
      },
    },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-4">
      <div className="card-premium p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-green">
          {t(locale, "priceQuoteSelectShop")}
        </p>
        <div className="flex flex-wrap gap-2">
          {activeShops.map((shop) => (
            <Link
              key={shop.id}
              href={`/customer/price-requests?shopId=${shop.id}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                shop.id === selectedShopId
                  ? "bg-brand-green text-brand-gold shadow-md"
                  : "bg-brand-cream text-brand-green ring-1 ring-brand-green/20 hover:ring-brand-green/40"
              }`}
            >
              {shop.shopName}
            </Link>
          ))}
        </div>
      </div>

      {favorites.length > 0 ? (
        <FavoritePriceQuoteForm
          locale={locale}
          shopId={selectedShopId}
          shopName={selectedShop.shopName}
          favorites={favorites}
        />
      ) : (
        <AskPriceOwnDesignCard locale={locale} shopId={selectedShopId} />
      )}
    </div>
  );
}
