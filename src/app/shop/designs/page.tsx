import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { ShopDesignsPanel } from "@/components/ShopDesignsPanel";
import { DESIGN_LIST_LIMIT } from "@/lib/limits";
import { shopStitchedDesignsWhere, visibleDesignsWhere } from "@/lib/design-access";
import { cachedCatalogCategoryCounts } from "@/lib/catalog-design-counts";
import { designListSelect } from "@/lib/design-list-select";
import { CATEGORIES } from "@/lib/categories";
import { withDbRetry } from "@/lib/safe-db";
import type { ServiceCategory } from "@prisma/client";

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
  searchParams: Promise<{ category?: string }>;
}) {
  const [session, locale, params] = await Promise.all([
    requireSession(["SHOP"]),
    getLocale(),
    searchParams,
  ]);
  const shopId = session!.shopId!;
  const category = resolveCategory(params.category);

  const [designs, catalogCounts, stitchedCount] = await Promise.all([
    withDbRetry(() =>
      prisma.design.findMany({
        where: visibleDesignsWhere(shopId, category),
        orderBy: [{ catalogNumber: "asc" }, { createdAt: "desc" }],
        take: DESIGN_LIST_LIMIT,
        select: designListSelect,
      })
    ),
    cachedCatalogCategoryCounts(),
    withDbRetry(() => prisma.design.count({ where: shopStitchedDesignsWhere(shopId) })),
  ]);

  const categoryCounts = {
    ...catalogCounts,
    STITCHED_DESIGNS: stitchedCount,
  } as Record<ServiceCategory, number>;

  return (
    <ShopDesignsPanel
      locale={locale}
      designs={designs}
      shopId={shopId}
      category={category}
      categoryCounts={categoryCounts}
    />
  );
}
