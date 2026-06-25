import type { DesignListItem } from "@/lib/design-queries";
import type { ServiceCategory } from "@prisma/client";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";

/** Catalog design is visible to customers/shops after admin assigns subgroup. */
export function isSortedCatalogDesign(
  design: Pick<DesignListItem, "category" | "sizeTier" | "catalogPart">,
  category?: ServiceCategory
): boolean {
  const cat = category ?? design.category;
  if (categoryHasSizeTiers(cat)) return design.sizeTier != null;
  if (categoryHasCatalogParts(cat)) return design.catalogPart != null;
  return true;
}

/** Category tab counts — same rules for shop and customer catalog views. */
export function countSortedCatalogDesignsByCategory(
  designs: Pick<DesignListItem, "category" | "sizeTier" | "catalogPart">[],
  categories: readonly ServiceCategory[] = CATALOG_CATEGORIES
): Record<ServiceCategory, number> {
  const map = {} as Record<ServiceCategory, number>;
  for (const cat of categories) {
    map[cat] = designs.filter((d) => d.category === cat && isSortedCatalogDesign(d, cat)).length;
  }
  return map;
}

export function categoryNeedsSorting(category: ServiceCategory): boolean {
  return categoryHasSizeTiers(category) || categoryHasCatalogParts(category);
}
