import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { CustomerCatalogPanel } from "@/components/CustomerCatalogPanel";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { isShopActive } from "@/lib/subscription";
import {
  CATALOG_CATEGORIES,
  isCatalogCategory,
  shopStitchedDesignsWhere,
} from "@/lib/design-access";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { cachedAppCatalogDesigns } from "@/lib/cached-catalog-designs";
import { DESIGN_CARD_SELECT } from "@/lib/design-queries";
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

  const [designs, ratingMap, customerFavorites, savedShop] = await Promise.all([
    prisma.design.findMany({
      where: shopStitchedDesignsWhere(shop.id),
      select: DESIGN_CARD_SELECT,
      orderBy: { createdAt: "desc" },
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
          {shop.shopCode} · {designs.length} {t(locale, "shopStitchedDesignsCount")}
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

      <ShopDesignCollections
        locale={locale}
        designs={designs}
        shopId={shop.id}
        favoriteDesignIds={favoriteDesignIds}
      />
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

  const customer = await prisma.user.findUniqueOrThrow({
    where: { id: session!.id },
    select: {
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      createdAt: true,
      phone: true,
      phoneNormalized: true,
    },
  });
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
  const category =
    rawCategory && isCatalogCategory(rawCategory) ? rawCategory : undefined;
  const rawSize = params.size?.toUpperCase();
  const initialSizeTier =
    rawSize === "SMALL" || rawSize === "MEDIUM" || rawSize === "BIG"
      ? (rawSize as DesignSizeTier)
      : undefined;
  const rawPart = params.part?.toUpperCase();
  const initialCatalogPart =
    rawPart === "MAIN" || rawPart === "HAND_SLEEVES" ? (rawPart as CatalogPart) : undefined;
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

  const [designs, customerFavorites] = await Promise.all([
    cachedAppCatalogDesigns(),
    priceShopId
      ? prisma.customerFavorite.findMany({
          where: { customerId: session!.id, shopId: priceShopId },
          select: { designId: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <CustomerCatalogPanel
      locale={locale}
      designs={designs}
      favoriteDesignIds={customerFavorites.map((f) => f.designId)}
      priceShopId={priceShopId}
      initialCategory={category && CATALOG_CATEGORIES.includes(category) ? category : undefined}
      initialSizeTier={
        category && categoryHasSizeTiers(category) ? initialSizeTier : undefined
      }
      initialCatalogPart={
        category && categoryHasCatalogParts(category) ? initialCatalogPart : undefined
      }
    />
  );
}
