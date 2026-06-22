import type { DesignListItem } from "@/lib/design-queries";
import type { ServiceCategory } from "@prisma/client";
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

export function categoryNeedsSorting(category: ServiceCategory): boolean {
  return categoryHasSizeTiers(category) || categoryHasCatalogParts(category);
}
