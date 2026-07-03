import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { AdminCatalogPanel } from "@/components/AdminCatalogPanel";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import {
  cachedAdminCategoryCounts,
  cachedCatalogPartCounts,
  cachedCatalogSizeTierCounts,
} from "@/lib/catalog-design-counts";
import {
  catalogAdminApiQuery,
  catalogAdminWhere,
  fetchCatalogDesignPage,
  parseAdminPartView,
  parseAdminSizeView,
} from "@/lib/catalog-design-list";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import type { ServiceCategory } from "@prisma/client";

const CATEGORY_KEYS = new Set(CATALOG_CATEGORIES);

function resolveCategory(raw?: string): ServiceCategory {
  if (raw && CATEGORY_KEYS.has(raw as ServiceCategory)) {
    return raw as ServiceCategory;
  }
  return CATALOG_CATEGORIES[0]!;
}

export default async function AdminDesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sizeView?: string; partView?: string }>;
}) {
  await requireSession(["ADMIN"]);
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const category = resolveCategory(params.category);
  const sizeView = categoryHasSizeTiers(category)
    ? parseAdminSizeView(params.sizeView)
    : undefined;
  const partView = categoryHasCatalogParts(category)
    ? parseAdminPartView(params.partView)
    : undefined;

  const adminQuery = { category, sizeView, partView };

  const [designPage, categoryCounts, tierCounts, partCounts] = await Promise.all([
    fetchCatalogDesignPage({ where: catalogAdminWhere(adminQuery), page: 1 }),
    cachedAdminCategoryCounts(),
    categoryHasSizeTiers(category) ? cachedCatalogSizeTierCounts(category) : Promise.resolve(null),
    categoryHasCatalogParts(category) ? cachedCatalogPartCounts(category) : Promise.resolve(null),
  ]);

  return (
    <AdminCatalogPanel
      locale={locale}
      category={category}
      sizeView={sizeView}
      partView={partView}
      designs={designPage.items}
      total={designPage.total ?? designPage.items.length}
      hasMore={designPage.hasMore}
      apiQuery={catalogAdminApiQuery(adminQuery)}
      categoryCounts={categoryCounts}
      tierCounts={tierCounts}
      partCounts={partCounts}
    />
  );
}
