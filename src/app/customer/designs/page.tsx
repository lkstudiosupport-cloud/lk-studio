import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { CustomerCatalogPanel } from "@/components/CustomerCatalogPanel";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { CatalogDesignPager } from "@/components/CatalogDesignPager";
import { isShopActive } from "@/lib/subscription";
import {
  isCatalogCategory,
  shopStitchedDesignsWhere,
} from "@/lib/design-access";
import { categoryHasSizeTiers, defaultSizeTierForCategory } from "@/lib/design-size-tier";
import { categoryHasCatalogParts, defaultCatalogPartForCategory } from "@/lib/design-catalog-part";
import {
  cachedCatalogCategoryCounts,
  cachedCatalogPartCounts,
  cachedCatalogSizeTierCounts,
} from "@/lib/catalog-design-counts";
import {
  catalogBrowseApiQuery,
  catalogBrowseWhere,
  fetchCatalogDesignPage,
} from "@/lib/catalog-design-list";
import { withDbRetry } from "@/lib/safe-db";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import Link from "next/link";
import { shopRatingSummaries } from "@/lib/shop-rating";
import { ShopRatingBadge } from "@/components/ShopRatingBadge";
import { SaveShopButton } from "@/components/SaveShopButton";
import { CustomerDesignPaywall } from "@/components/CustomerDesignPaywall";
import { canCustomerBrowseDesigns } from "@/lib/subscription";
import { isDemoAccountUser } from "@/lib/demo-accounts";

/** Shop stitched designs only — after picking a shop from Find Shops. */
async function CustomerShopStitchedPage({
  locale,
  customerId,
  shopId,
}: {
  locale: Awaited<ReturnType<typeof getLocale>>;
  customerId: string;
  shopId: string;
}) {
  const shop = await prisma.shopProfile.findUnique({ where: { id: shopId } });

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

  const [designPage, ratingMap, customerFavorites, savedShop] = await Promise.all([
    fetchCatalogDesignPage({
      where: shopStitchedDesignsWhere(shop.id),
      page: 1,
    }),
    shopRatingSummaries([shop.id]),
    prisma.customerFavorite.findMany({
      where: { customerId, shopId: shop.id },
      select: { designId: true },
    }),
    prisma.customerSavedShop.findUnique({
      where: { customerId_shopId: { customerId, shopId: shop.id } },
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
          {shop.shopCode} · {designPage.total ?? designPage.items.length}{" "}
          {t(locale, "shopStitchedDesignsCount")}
        </p>
        <div className="mt-1">
          <ShopRatingBadge locale={locale} average={rating?.average ?? 0} count={rating?.count ?? 0} />
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
            href={`/customer/price-requests?shopId=${shop.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-cream px-3 py-1.5 text-sm font-semibold text-brand-green ring-1 ring-brand-green/15"
          >
            {t(locale, "myPriceQuotes")}
          </Link>
        </div>
      </div>

      <p className="text-sm text-zinc-600">{t(locale, "shopStitchedDesignsHint")}</p>

      <CatalogDesignPager
        locale={locale}
        initialDesigns={designPage.items}
        total={designPage.total ?? designPage.items.length}
        hasMore={designPage.hasMore}
        apiQuery={`category=STITCHED_DESIGNS&shopId=${shop.id}`}
      >
        {(pagedDesigns) => (
          <ShopDesignCollections
            locale={locale}
            designs={pagedDesigns}
            shopId={shop.id}
            favoriteDesignIds={favoriteDesignIds}
          />
        )}
      </CatalogDesignPager>
    </div>
  );
}

export default async function CustomerDesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; shopId?: string; size?: string; part?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const params = await searchParams;

  const customer = await prisma.user.findUnique({
    where: { id: session!.id },
    select: {
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      createdAt: true,
      phone: true,
      phoneNormalized: true,
    },
  });
  if (!customer) {
    return (
      <div className="card-premium p-6 text-center text-sm text-zinc-600">
        {t(locale, "noData")}
      </div>
    );
  }
  const designAccess =
    isDemoAccountUser(customer) ||
    canCustomerBrowseDesigns(
      customer.subscriptionStatus,
      customer.subscriptionEndsAt,
      customer.createdAt
    );
  if (!designAccess) {
    return <CustomerDesignPaywall locale={locale} />;
  }

  const rawCategory = params.category as ServiceCategory | undefined;
  const category: ServiceCategory =
    rawCategory && isCatalogCategory(rawCategory) ? rawCategory : "MAGGAM";
  const rawSize = params.size?.toUpperCase();
  const sizeFromParams =
    rawSize === "SMALL" || rawSize === "MEDIUM" || rawSize === "BIG"
      ? (rawSize as DesignSizeTier)
      : undefined;
  const initialSizeTier = categoryHasSizeTiers(category)
    ? sizeFromParams ?? defaultSizeTierForCategory(category)
    : undefined;
  const rawPart = params.part?.toUpperCase();
  const partFromParams =
    rawPart === "MAIN" || rawPart === "HAND_SLEEVES" ? (rawPart as CatalogPart) : undefined;
  const initialCatalogPart = categoryHasCatalogParts(category)
    ? partFromParams ?? defaultCatalogPartForCategory(category)
    : undefined;
  const shopIdParam = params.shopId?.trim();

  if (shopIdParam) {
    return (
      <CustomerShopStitchedPage
        locale={locale}
        customerId={session!.id}
        shopId={shopIdParam}
      />
    );
  }

  const savedShop = await prisma.customerSavedShop.findFirst({
    where: { customerId: session!.id },
    orderBy: { createdAt: "desc" },
    select: { shopId: true },
  });
  const priceShopId = savedShop?.shopId;

  const [designPage, categoryCounts, tierCounts, partCounts, customerFavorites] = await Promise.all([
    fetchCatalogDesignPage({
      where: catalogBrowseWhere({ category, sizeTier: initialSizeTier, catalogPart: initialCatalogPart }),
      page: 1,
    }),
    cachedCatalogCategoryCounts(),
    categoryHasSizeTiers(category) ? cachedCatalogSizeTierCounts(category) : Promise.resolve(null),
    categoryHasCatalogParts(category) ? cachedCatalogPartCounts(category) : Promise.resolve(null),
    priceShopId
      ? withDbRetry(() =>
          prisma.customerFavorite.findMany({
            where: { customerId: session!.id, shopId: priceShopId },
            select: { designId: true },
          })
        )
      : Promise.resolve([]),
  ]);

  const apiQuery = catalogBrowseApiQuery({
    category,
    sizeTier: initialSizeTier,
    catalogPart: initialCatalogPart,
  });

  return (
    <CustomerCatalogPanel
      locale={locale}
      designs={designPage.items}
      total={designPage.total ?? designPage.items.length}
      hasMore={designPage.hasMore}
      apiQuery={apiQuery}
      categoryCounts={categoryCounts}
      tierCounts={tierCounts}
      partCounts={partCounts}
      favoriteDesignIds={customerFavorites.map((f) => f.designId)}
      priceShopId={priceShopId}
      initialCategory={category}
      initialSizeTier={initialSizeTier}
      initialCatalogPart={initialCatalogPart}
    />
  );
}
