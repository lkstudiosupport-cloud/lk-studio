import type { Prisma } from "@prisma/client";
import type { DesignSizeTier, ServiceCategory } from "@prisma/client";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";

/** Only category shops may upload, edit, or delete. */
export const SHOP_OWNED_UPLOAD_CATEGORY = "STITCHED_DESIGNS" as const;

/** @deprecated use SHOP_OWNED_UPLOAD_CATEGORY */
export const SHOP_UPLOAD_CATEGORY = SHOP_OWNED_UPLOAD_CATEGORY;

/** App catalog — uploaded by LK Studio (seed/admin), view-only for shops; customers can favorite. */
export const CATALOG_CATEGORIES: ServiceCategory[] = [
  "MAGGAM",
  "COMPUTER_EMBROIDERY",
  "BLOUSE_DESIGN",
  "DRESS_MODEL",
  "CHILDREN_WEAR",
];

export function isShopOwnedUploadCategory(category: ServiceCategory): boolean {
  return category === SHOP_OWNED_UPLOAD_CATEGORY;
}

/** @alias isShopOwnedUploadCategory */
export function isShopUploadCategory(category: ServiceCategory): boolean {
  return isShopOwnedUploadCategory(category);
}

export function isCatalogCategory(category: ServiceCategory): boolean {
  return CATALOG_CATEGORIES.includes(category);
}

function sizeTierFilter(sizeTier?: DesignSizeTier): Prisma.DesignWhereInput {
  return sizeTier ? { sizeTier } : {};
}

/** Designs visible on a shop's gallery (app catalog + shop stitched work). */
export function visibleDesignsWhere(
  shopId: string,
  category?: ServiceCategory,
  sizeTier?: DesignSizeTier
): Prisma.DesignWhereInput {
  if (category) {
    if (isShopOwnedUploadCategory(category)) {
      return { shopId, category, active: true, isCatalog: false };
    }
    if (categoryHasSizeTiers(category)) {
      return { isCatalog: true, category, active: true, ...sizeTierFilter(sizeTier) };
    }
    return { isCatalog: true, category, active: true };
  }
  return {
    active: true,
    OR: [
      { isCatalog: true, category: { in: CATALOG_CATEGORIES } },
      { shopId, category: SHOP_OWNED_UPLOAD_CATEGORY, isCatalog: false },
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

/** Shop may delete or edit only their own stitched designs. */
export function shopManageableDesignWhere(shopId: string, designId: string): Prisma.DesignWhereInput {
  return {
    id: designId,
    shopId,
    isCatalog: false,
    category: SHOP_OWNED_UPLOAD_CATEGORY,
  };
}
