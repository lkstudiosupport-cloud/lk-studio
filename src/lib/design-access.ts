import type { Prisma } from "@prisma/client";
import type { DesignSizeTier, ServiceCategory } from "@prisma/client";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";

/** Shop-owned uploads (per shop gallery). */
export const SHOP_OWNED_UPLOAD_CATEGORY = "STITCHED_DESIGNS" as const;

/** App catalog uploads with size tier (visible to all shops/customers). */
export const CATALOG_UPLOAD_CATEGORIES: ServiceCategory[] = ["MAGGAM", "COMPUTER_EMBROIDERY"];

/** @deprecated use SHOP_OWNED_UPLOAD_CATEGORY */
export const SHOP_UPLOAD_CATEGORY = SHOP_OWNED_UPLOAD_CATEGORY;

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

export function isCatalogUploadCategory(category: ServiceCategory): boolean {
  return CATALOG_UPLOAD_CATEGORIES.includes(category);
}

export function isShopUploadCategory(category: ServiceCategory): boolean {
  return isShopOwnedUploadCategory(category) || isCatalogUploadCategory(category);
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

/** Shop may delete: own stitched designs, or catalog items they uploaded. */
export function shopManageableDesignWhere(shopId: string, designId: string): Prisma.DesignWhereInput {
  return {
    id: designId,
    OR: [
      { shopId, isCatalog: false, category: SHOP_OWNED_UPLOAD_CATEGORY },
      { isCatalog: true, uploadedByShopId: shopId, category: { in: CATALOG_UPLOAD_CATEGORIES } },
    ],
  };
}
