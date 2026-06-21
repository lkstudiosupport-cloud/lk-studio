import type { Prisma } from "@prisma/client";
import type { ServiceCategory } from "@prisma/client";

/** Only category shops may upload, edit, or delete. */
export const SHOP_OWNED_UPLOAD_CATEGORY = "STITCHED_DESIGNS" as const;

/** @deprecated use SHOP_OWNED_UPLOAD_CATEGORY */
export const SHOP_UPLOAD_CATEGORY = SHOP_OWNED_UPLOAD_CATEGORY;

/** App catalog — uploaded by LK Studio admin only; view-only for shops and customers. */
export const CATALOG_CATEGORIES: ServiceCategory[] = [
  "MAGGAM",
  "COMPUTER_EMBROIDERY",
  "BLOUSE_DESIGN",
  "DRESS_MODEL",
  "CHILDREN_WEAR",
];

/** @deprecated Shops no longer upload catalog categories — admin only. */
export const CATALOG_UPLOAD_CATEGORIES: ServiceCategory[] = [];

export function isCatalogUploadCategory(_category: ServiceCategory): boolean {
  return false;
}

export function isShopOwnedUploadCategory(category: ServiceCategory): boolean {
  return category === SHOP_OWNED_UPLOAD_CATEGORY;
}

/** @alias isShopOwnedUploadCategory — only stitched designs. */
export function isShopUploadCategory(category: ServiceCategory): boolean {
  return isShopOwnedUploadCategory(category);
}

export function isCatalogCategory(category: ServiceCategory): boolean {
  return CATALOG_CATEGORIES.includes(category);
}

/** App catalog designs (admin) — same for all shops. */
export function appCatalogDesignsWhere(category?: ServiceCategory): Prisma.DesignWhereInput {
  if (category && isCatalogCategory(category)) {
    return { isCatalog: true, category, active: true };
  }
  return { isCatalog: true, category: { in: CATALOG_CATEGORIES }, active: true };
}

/** Stitched work uploaded by a specific shop. */
export function shopStitchedDesignsWhere(shopId: string): Prisma.DesignWhereInput {
  return {
    shopId,
    category: SHOP_OWNED_UPLOAD_CATEGORY,
    isCatalog: false,
    active: true,
  };
}

/** @deprecated Prefer appCatalogDesignsWhere or shopStitchedDesignsWhere for customer UI. */
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

/** Shop may delete or edit own stitched designs only. */
export function shopManageableDesignWhere(shopId: string, designId: string): Prisma.DesignWhereInput {
  return {
    id: designId,
    shopId,
    isCatalog: false,
    category: SHOP_OWNED_UPLOAD_CATEGORY,
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
