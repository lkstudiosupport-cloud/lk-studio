import type { Prisma } from "@prisma/client";
import type { ServiceCategory } from "@prisma/client";

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

/** Categories shops may upload (own stitched work + shared catalog maggam). */
export const CATALOG_UPLOAD_CATEGORIES: ServiceCategory[] = ["MAGGAM"];

export function isCatalogUploadCategory(category: ServiceCategory): boolean {
  return CATALOG_UPLOAD_CATEGORIES.includes(category);
}

export function isShopOwnedUploadCategory(category: ServiceCategory): boolean {
  return category === SHOP_OWNED_UPLOAD_CATEGORY;
}

/** @alias isShopOwnedUploadCategory */
export function isShopUploadCategory(category: ServiceCategory): boolean {
  return isShopOwnedUploadCategory(category) || isCatalogUploadCategory(category);
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
    if (isShopOwnedUploadCategory(category)) {
      return { shopId, category, active: true, isCatalog: false };
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

/** Shop may delete or edit own stitched designs and catalog uploads they added. */
export function shopManageableDesignWhere(shopId: string, designId: string): Prisma.DesignWhereInput {
  return {
    id: designId,
    OR: [
      {
        shopId,
        isCatalog: false,
        category: SHOP_OWNED_UPLOAD_CATEGORY,
      },
      {
        isCatalog: true,
        uploadedByShopId: shopId,
        category: { in: CATALOG_UPLOAD_CATEGORIES },
      },
    ],
  };
}

/** Design a customer may favorite or ask price for while browsing a given shop. */
export function designVisibleToCustomerShopWhere(
  designId: string,
  _shopId: string
): Prisma.DesignWhereInput {
  return {
    id: designId,
    active: true,
    OR: [
      { isCatalog: true, category: { in: CATALOG_CATEGORIES } },
      { shopId: _shopId, category: SHOP_OWNED_UPLOAD_CATEGORY, isCatalog: false },
    ],
  };
}
