import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { CategoryButtons } from "@/components/CategoryButtons";
import { AskPriceForm, AskPriceOwnDesignCard } from "@/components/AskPriceForm";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { isShopActive } from "@/lib/subscription";
import type { ServiceCategory } from "@prisma/client";
import Link from "next/link";
import { shopRatingSummaries } from "@/lib/shop-rating";
import { ShopRatingBadge } from "@/components/ShopRatingBadge";
import { SaveShopButton } from "@/components/SaveShopButton";

export default async function CustomerDesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; shopId?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const params = await searchParams;
  const category = params.category as ServiceCategory | undefined;
  const shopIdParam = params.shopId;

  const shop = shopIdParam
    ? await prisma.shopProfile.findUnique({ where: { id: shopIdParam } })
    : await prisma.shopProfile.findFirst();

  if (!shop || !isShopActive(shop.subscriptionStatus, shop.subscriptionEndsAt)) {
    return (
      <div className="card-premium p-6 text-center">
        <p className="text-zinc-600">{t(locale, "shopUnavailable")}</p>
        <Link href="/customer/shops" className="mt-4 inline-block font-semibold text-brand-green underline">
          {t(locale, "browseShops")}
        </Link>
      </div>
    );
  }

  const [designs, totalDesigns, ratingMap, customerFavorites, savedShop] = await Promise.all([
    prisma.design.findMany({
      where: {
        shopId: shop.id,
        active: true,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.design.count({ where: { shopId: shop.id, active: true } }),
    shopRatingSummaries([shop.id]),
    prisma.customerFavorite.findMany({
      where: { customerId: session!.id, shopId: shop.id },
      select: { designId: true },
    }),
    prisma.customerSavedShop.findUnique({
      where: { customerId_shopId: { customerId: session!.id, shopId: shop.id } },
      select: { id: true },
    }),
  ]);

  const rating = ratingMap.get(shop.id);
  const favoriteDesignIds = new Set(customerFavorites.map((f) => f.designId));
  const favoriteCount = favoriteDesignIds.size;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/customer/shops" className="text-sm text-brand-green underline">
          ← {t(locale, "browseShops")}
        </Link>
        <h1 className="page-title mt-2">{shop.shopName}</h1>
        <p className="text-sm text-zinc-500">
          {shop.shopCode} · {totalDesigns} {t(locale, "shopCollectionCount")}
        </p>
        <div className="mt-1">
          <ShopRatingBadge
            locale={locale}
            average={rating?.average ?? 0}
            count={rating?.count ?? 0}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SaveShopButton shopId={shop.id} isSaved={!!savedShop} locale={locale} />
          <Link
            href={`/customer/favorites?shopId=${shop.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-gold/25 px-3 py-1.5 text-sm font-semibold text-brand-green"
          >
            {t(locale, "myFavorites")} ({favoriteCount})
          </Link>
          <Link
            href="/customer/price-requests"
            className="inline-flex items-center gap-1 rounded-full bg-brand-cream px-3 py-1.5 text-sm font-semibold text-brand-green ring-1 ring-brand-green/15"
          >
            {t(locale, "myPriceQuotes")}
          </Link>
        </div>
      </div>

      <CategoryButtons locale={locale} basePath={`/customer/designs?shopId=${shop.id}`} active={category} />

      <AskPriceOwnDesignCard locale={locale} shopId={shop.id} />

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-green">
          {t(locale, "shopCollections")}
        </h2>
        <ShopDesignCollections
          locale={locale}
          designs={designs}
          shopId={shop.id}
          activeCategory={category}
          favoriteDesignIds={favoriteDesignIds}
          renderAction={(d) => (
            <AskPriceForm locale={locale} shopId={shop.id} design={d} compact />
          )}
        />
      </div>
    </div>
  );
}
