import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { ShopDesignsPanel } from "@/components/ShopDesignsPanel";
import { isShopOwnedUploadCategory, shopStitchedDesignsWhere } from "@/lib/design-access";
import { cachedCatalogCategoryCounts, fetchCatalogPartCounts, fetchCatalogSizeTierCounts } from "@/lib/catalog-design-counts";
import {
  catalogBrowseApiQuery,
  fetchCatalogDesignPage,
  parseCatalogPart,
  parseSizeTier,
  shopDesignsWhere,
} from "@/lib/catalog-design-list";
import { CATEGORIES } from "@/lib/categories";
import { categoryHasCatalogParts, defaultCatalogPartForCategory } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers, defaultSizeTierForCategory } from "@/lib/design-size-tier";
import { withDbRetry } from "@/lib/safe-db";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";

const CATEGORY_KEYS = new Set(CATEGORIES.map((c) => c.key));

function resolveCategory(raw?: string): ServiceCategory {
  if (raw && CATEGORY_KEYS.has(raw as ServiceCategory)) {
    return raw as ServiceCategory;
  }
  return CATEGORIES[0].key;
}

export default async function ShopDesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; size?: string; part?: string }>;
}) {
  const [session, locale, params] = await Promise.all([
    requireSession(["SHOP"]),
    getLocale(),
    searchParams,
  ]);
  const shopId = session!.shopId!;
  const category = resolveCategory(params.category);
  const sizeTier = categoryHasSizeTiers(category)
    ? parseSizeTier(params.size) ?? defaultSizeTierForCategory(category)
    : undefined;
  const catalogPart = categoryHasCatalogParts(category)
    ? parseCatalogPart(params.part) ?? defaultCatalogPartForCategory(category)
    : undefined;

  const browseQuery = { category, sizeTier, catalogPart };
  const listWhere = isShopOwnedUploadCategory(category)
    ? shopStitchedDesignsWhere(shopId)
    : shopDesignsWhere(shopId, browseQuery);

  const [designPage, catalogCounts, stitchedCount, tierCounts, partCounts] = await Promise.all([
    fetchCatalogDesignPage({ where: listWhere, page: 1 }),
    cachedCatalogCategoryCounts(),
    withDbRetry(() => prisma.design.count({ where: shopStitchedDesignsWhere(shopId) })),
    categoryHasSizeTiers(category) ? fetchCatalogSizeTierCounts(category) : Promise.resolve(null),
    categoryHasCatalogParts(category) ? fetchCatalogPartCounts(category) : Promise.resolve(null),
  ]);

  const categoryCounts = {
    ...catalogCounts,
    STITCHED_DESIGNS: stitchedCount,
  } as Record<ServiceCategory, number>;

  const apiQuery = isShopOwnedUploadCategory(category)
    ? `category=${category}`
    : catalogBrowseApiQuery(browseQuery);

  return (
    <ShopDesignsPanel
      locale={locale}
      designs={designPage.items}
      total={designPage.total}
      hasMore={designPage.hasMore}
      apiQuery={apiQuery}
      shopId={shopId}
      category={category}
      sizeTier={sizeTier}
      catalogPart={catalogPart}
      categoryCounts={categoryCounts}
      tierCounts={tierCounts}
      partCounts={partCounts}
    />
  );
}
