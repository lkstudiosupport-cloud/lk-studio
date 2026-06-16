import type { Prisma } from "@prisma/client";
import type { ServiceCategory } from "@prisma/client";

/** Only category shops may upload or delete. */
export const SHOP_UPLOAD_CATEGORY = "STITCHED_DESIGNS" as const;

export const CATALOG_CATEGORIES: ServiceCategory[] = [
  "MAGGAM",
  "COMPUTER_EMBROIDERY",
  "BLOUSE_DESIGN",
  "DRESS_MODEL",
  "CHILDREN_WEAR",
];

export function isShopUploadCategory(category: ServiceCategory): boolean {
  return category === SHOP_UPLOAD_CATEGORY;
}

export function isCatalogCategory(category: ServiceCategory): boolean {
  return CATALOG_CATEGORIES.includes(category);
}

/** Designs visible on a shop's gallery (app catalog + shop stitched work). */
export function visibleDesignsWhere(
  shopId: string,
  category?: ServiceCategory
): Prisma.DesignWhereInput {
  if (category) {
    if (isShopUploadCategory(category)) {
      return { shopId, category, active: true, isCatalog: false };
    }
    return { isCatalog: true, category, active: true };
  }
  return {
    active: true,
    OR: [
      { isCatalog: true, category: { in: CATALOG_CATEGORIES } },
      { shopId, category: SHOP_UPLOAD_CATEGORY, isCatalog: false },
    ],
  };
}

export function visibleDesignCountWhere(shopId: string): Prisma.DesignWhereInput {
  return visibleDesignsWhere(shopId);
}

export async function countVisibleDesigns(
  prisma: { design: { count: (args: { where: Prisma.DesignWhereInput }) => Promise<number> } },
  shopId: string
): Promise<number> {
  return prisma.design.count({ where: visibleDesignCountWhere(shopId) });
}
