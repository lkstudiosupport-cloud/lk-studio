import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { AdminCatalogPanel } from "@/components/AdminCatalogPanel";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import {
  cachedAdminCategoryCounts,
  fetchCatalogPartCounts,
  fetchCatalogSizeTierCounts,
} from "@/lib/catalog-design-counts";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { designListSelect } from "@/lib/design-list-select";
import { withDbRetry } from "@/lib/safe-db";
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
  searchParams: Promise<{ category?: string }>;
}) {
  await requireSession(["ADMIN"]);
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const category = resolveCategory(params.category);

  const [designs, categoryCounts, tierCounts, partCounts] = await Promise.all([
    withDbRetry(() =>
      prisma.design.findMany({
        where: { isCatalog: true, category, active: true },
        select: designListSelect,
        orderBy: [{ catalogNumber: "asc" }, { createdAt: "desc" }],
      })
    ),
    cachedAdminCategoryCounts(),
    categoryHasSizeTiers(category) ? fetchCatalogSizeTierCounts(category) : Promise.resolve(null),
    categoryHasCatalogParts(category) ? fetchCatalogPartCounts(category) : Promise.resolve(null),
  ]);

  return (
    <AdminCatalogPanel
      locale={locale}
      category={category}
      designs={designs}
      categoryCounts={categoryCounts}
      tierCounts={tierCounts}
      partCounts={partCounts}
    />
  );
}
