import { unstable_cache } from "next/cache";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CATALOG_CATEGORIES, shopStitchedDesignsWhere, sortedCatalogDesignWhere } from "@/lib/design-access";
import { withDbRetry } from "@/lib/safe-db";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";

const COUNT_REVALIDATE_SEC = 45;

async function fetchCatalogCategoryCounts(): Promise<Partial<Record<ServiceCategory, number>>> {
  const rows = await Promise.all(
    CATALOG_CATEGORIES.map(async (category) => ({
      category,
      count: await withDbRetry(() =>
        prisma.design.count({ where: sortedCatalogDesignWhere(category) })
      ),
    }))
  );
  return Object.fromEntries(rows.map(({ category, count }) => [category, count]));
}

async function fetchAdminCategoryCounts(): Promise<Partial<Record<ServiceCategory, number>>> {
  const rows = await Promise.all(
    CATALOG_CATEGORIES.map(async (category) => ({
      category,
      count: await withDbRetry(() =>
        prisma.design.count({ where: { isCatalog: true, category, active: true } })
      ),
    }))
  );
  return Object.fromEntries(rows.map(({ category, count }) => [category, count]));
}

export type CatalogSizeTierCounts = Record<DesignSizeTier, number> & { unassigned: number };
export type CatalogPartCounts = Record<CatalogPart, number> & { unassigned: number };

export async function fetchCatalogSizeTierCounts(
  category: ServiceCategory
): Promise<CatalogSizeTierCounts> {
  const base = { isCatalog: true, category, active: true };
  const [SMALL, MEDIUM, BIG, unassigned] = await Promise.all([
    withDbRetry(() => prisma.design.count({ where: { ...base, sizeTier: "SMALL" } })),
    withDbRetry(() => prisma.design.count({ where: { ...base, sizeTier: "MEDIUM" } })),
    withDbRetry(() => prisma.design.count({ where: { ...base, sizeTier: "BIG" } })),
    withDbRetry(() => prisma.design.count({ where: { ...base, sizeTier: null } })),
  ]);
  return { SMALL, MEDIUM, BIG, unassigned };
}

export async function fetchCatalogPartCounts(category: ServiceCategory): Promise<CatalogPartCounts> {
  const base = { isCatalog: true, category, active: true };
  const [MAIN, HAND_SLEEVES, unassigned] = await Promise.all([
    withDbRetry(() => prisma.design.count({ where: { ...base, catalogPart: "MAIN" } })),
    withDbRetry(() => prisma.design.count({ where: { ...base, catalogPart: "HAND_SLEEVES" } })),
    withDbRetry(() => prisma.design.count({ where: { ...base, catalogPart: null } })),
  ]);
  return { MAIN, HAND_SLEEVES, unassigned };
}

export const cachedCatalogCategoryCounts = unstable_cache(
  fetchCatalogCategoryCounts,
  ["catalog-category-counts"],
  { revalidate: COUNT_REVALIDATE_SEC }
);

export const cachedAdminCategoryCounts = unstable_cache(
  fetchAdminCategoryCounts,
  ["admin-category-counts"],
  { revalidate: COUNT_REVALIDATE_SEC }
);

export function cachedCatalogSizeTierCounts(category: ServiceCategory) {
  return unstable_cache(
    () => fetchCatalogSizeTierCounts(category),
    ["catalog-size-tier-counts", category],
    { revalidate: COUNT_REVALIDATE_SEC }
  )();
}

export function cachedCatalogPartCounts(category: ServiceCategory) {
  return unstable_cache(
    () => fetchCatalogPartCounts(category),
    ["catalog-part-counts", category],
    { revalidate: COUNT_REVALIDATE_SEC }
  )();
}

export function cachedShopStitchedCount(shopId: string) {
  return unstable_cache(
    () => withDbRetry(() => prisma.design.count({ where: shopStitchedDesignsWhere(shopId) })),
    ["shop-stitched-count", shopId],
    { revalidate: COUNT_REVALIDATE_SEC }
  )();
}

export async function cachedAllCatalogSizeTierCounts(): Promise<
  Partial<Record<ServiceCategory, CatalogSizeTierCounts>>
> {
  const tierCategories = CATALOG_CATEGORIES.filter((cat) => categoryHasSizeTiers(cat));
  const entries = await Promise.all(
    tierCategories.map(async (cat) => [cat, await cachedCatalogSizeTierCounts(cat)] as const)
  );
  return Object.fromEntries(entries);
}

export async function cachedAllCatalogPartCounts(): Promise<
  Partial<Record<ServiceCategory, CatalogPartCounts>>
> {
  const partCategories = CATALOG_CATEGORIES.filter((cat) => categoryHasCatalogParts(cat));
  const entries = await Promise.all(
    partCategories.map(async (cat) => [cat, await cachedCatalogPartCounts(cat)] as const)
  );
  return Object.fromEntries(entries);
}
