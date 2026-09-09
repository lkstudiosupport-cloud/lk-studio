import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import type { CachedDesign } from "@/lib/catalog-sync/types";
import type { DesignListItem } from "@/lib/design-list-select";
import { CATALOG_PAGE_SIZE } from "@/lib/limits";

export function cachedDesignToListItem(d: CachedDesign): DesignListItem {
  return {
    id: d.id,
    shopId: d.shopId,
    isCatalog: d.isCatalog,
    catalogNumber: d.catalogNumber,
    title: d.title,
    imagePath: d.imagePath,
    imagesJson: d.imagesJson,
    category: d.category,
    createdAt: new Date(d.createdAt),
    sizeTier: d.sizeTier,
    catalogPart: d.catalogPart,
  };
}

export function listItemToCachedDesign(d: DesignListItem & { updatedAt?: Date | string }): CachedDesign {
  return {
    id: d.id,
    shopId: d.shopId,
    isCatalog: d.isCatalog,
    catalogNumber: d.catalogNumber,
    title: d.title,
    imagePath: d.imagePath,
    imagesJson: d.imagesJson,
    category: d.category,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
    updatedAt:
      d.updatedAt instanceof Date
        ? d.updatedAt.toISOString()
        : d.updatedAt
          ? String(d.updatedAt)
          : undefined,
    sizeTier: d.sizeTier,
    catalogPart: d.catalogPart,
  };
}

function catalogNumberSort(a: CachedDesign, b: CachedDesign): number {
  const an = a.catalogNumber ?? "";
  const bn = b.catalogNumber ?? "";
  if (an !== bn) return an.localeCompare(bn);
  return b.createdAt.localeCompare(a.createdAt);
}

/** Filter cached catalog designs for a browse query (mirrors sortedCatalogDesignWhere). */
export function filterCachedCatalogDesigns(
  designs: CachedDesign[],
  query: {
    category: ServiceCategory;
    sizeTier?: DesignSizeTier;
    catalogPart?: CatalogPart;
  }
): CachedDesign[] {
  const { category, sizeTier, catalogPart } = query;
  const filtered = designs.filter((d) => {
    if (!d.isCatalog || d.category !== category) return false;
    if (categoryHasSizeTiers(category)) {
      if (!d.sizeTier) return false;
      if (sizeTier && d.sizeTier !== sizeTier) return false;
    }
    if (categoryHasCatalogParts(category)) {
      if (!d.catalogPart) return false;
      if (catalogPart && d.catalogPart !== catalogPart) return false;
    }
    return true;
  });
  return filtered.sort(catalogNumberSort);
}

export function pageCachedDesigns(
  designs: CachedDesign[],
  page: number,
  pageSize = CATALOG_PAGE_SIZE
): { items: DesignListItem[]; total: number; hasMore: boolean; page: number } {
  const p = Math.max(1, page);
  const start = (p - 1) * pageSize;
  const slice = designs.slice(start, start + pageSize);
  return {
    items: slice.map(cachedDesignToListItem),
    total: designs.length,
    hasMore: start + slice.length < designs.length,
    page: p,
  };
}
