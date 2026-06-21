import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { CategoryButtons } from "@/components/CategoryButtons";
import { AskPriceOwnDesignCard } from "@/components/AskPriceForm";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { isShopActive } from "@/lib/subscription";
import {
  appCatalogDesignsWhere,
  CATALOG_CATEGORIES,
  shopStitchedDesignsWhere,
} from "@/lib/design-access";
import type { ServiceCategory } from "@prisma/client";
import Link from "next/link";
import { shopRatingSummaries } from "@/lib/shop-rating";
import { ShopRatingBadge } from "@/components/ShopRatingBadge";
import { SaveShopButton } from "@/components/SaveShopButton";
import { withQueryParam } from "@/lib/query-string";

/** App catalog (Maggam, Embroidery, Blouse, Dress, Children) — no shop required. */
async function CustomerAppCatalogPage({
  locale,
  customerId,
  category,
}: {
  locale: Awaited<ReturnType<typeof getLocale>>;
  customerId: string;
  category?: ServiceCategory;
}) {
  const savedShop = await prisma.customerSavedShop.findFirst({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: { shopId: true },
  });
  const priceShopId = savedShop?.shopId;

  const [designs, totalDesigns, customerFavorites] = await Promise.all([
    prisma.design.findMany({
      where: appCatalogDesignsWhere(category),
      orderBy: [{ catalogNumber: "asc" }, { createdAt: "desc" }],
    }),
    prisma.design.count({ where: appCatalogDesignsWhere() }),
    priceShopId
      ? prisma.customerFavorite.findMany({
          where: { customerId, shopId: priceShopId },
          select: { designId: true },
        })
      : Promise.resolve([]),
  ]);

  const favoriteDesignIds = new Set(customerFavorites.map((f) => f.designId));
  const basePath = "/customer/designs";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "designs")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "customerCatalogDesignsHint")}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {totalDesigns} {t(locale, "collectionItems")}
        </p>
      </div>

      <CategoryButtons
        locale={locale}
        basePath={basePath}
        active={category}
        categories={CATALOG_CATEGORIES}
      />

      {priceShopId && (category === "MAGGAM" || category === "COMPUTER_EMBROIDERY") && (
        <AskPriceOwnDesignCard locale={locale} shopId={priceShopId} defaultCategory={category} />
      )}

      {!priceShopId && (category === "MAGGAM" || category === "COMPUTER_EMBROIDERY") && (
        <p className="card-premium p-4 text-sm text-zinc-600">
          {t(locale, "pickShopForPriceQuote")}{" "}
          <Link href="/customer/shops" className="font-semibold text-brand-green underline">
            {t(locale, "browseShops")}
          </Link>
        </p>
      )}

      <ShopDesignCollections
        locale={locale}
        designs={designs}
        shopId={priceShopId ?? undefined}
        favoriteDesignIds={favoriteDesignIds}
        detailHrefForDesign={(d) =>
          withQueryParam(`/customer/designs/${d.id}`, "category", d.category)
        }
      />
    </div>
  );
}

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

  const [designs, stitchedCount, ratingMap, customerFavorites, savedShop] = await Promise.all([
    prisma.design.findMany({
      where: shopStitchedDesignsWhere(shop.id),
      orderBy: { createdAt: "desc" },
    }),
    prisma.design.count({ where: shopStitchedDesignsWhere(shop.id) }),
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
          {shop.shopCode} · {stitchedCount} {t(locale, "shopStitchedDesignsCount")}
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
  searchParams: Promise<{ category?: string; shopId?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const params = await searchParams;
  const category = params.category as ServiceCategory | undefined;
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

  return (
    <CustomerAppCatalogPage locale={locale} customerId={session!.id} category={category} />
  );
}
