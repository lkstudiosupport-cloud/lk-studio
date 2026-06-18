import type { ServiceCategory } from "@prisma/client";
import { isCatalogUploadCategory, isShopOwnedUploadCategory } from "@/lib/design-access";

/** Green fill + gold/yellow text — same look for every category button. */
export const CATEGORY_BUTTON_CLASS = "bg-brand-green text-brand-gold";

export const CATEGORIES: {
  key: ServiceCategory;
  labelKey: string;
  color: string;
  shopUpload?: boolean;
  catalogUpload?: boolean;
}[] = [
  { key: "MAGGAM", labelKey: "categories.maggam", color: CATEGORY_BUTTON_CLASS, catalogUpload: true },
  {
    key: "COMPUTER_EMBROIDERY",
    labelKey: "categories.embroidery",
    color: CATEGORY_BUTTON_CLASS,
    catalogUpload: true,
  },
  { key: "BLOUSE_DESIGN", labelKey: "categories.blouse", color: CATEGORY_BUTTON_CLASS },
  { key: "DRESS_MODEL", labelKey: "categories.dress", color: CATEGORY_BUTTON_CLASS },
  { key: "CHILDREN_WEAR", labelKey: "categories.children", color: CATEGORY_BUTTON_CLASS },
  { key: "STITCHED_DESIGNS", labelKey: "categories.stitched", color: CATEGORY_BUTTON_CLASS, shopUpload: true },
];

export function isCategoryShopUpload(key: ServiceCategory): boolean {
  return isShopOwnedUploadCategory(key) || isCatalogUploadCategory(key);
}

export function isCategoryCatalogUpload(key: ServiceCategory): boolean {
  return isCatalogUploadCategory(key);
}

export function categoryLabelKey(cat: ServiceCategory) {
  return CATEGORIES.find((c) => c.key === cat)?.labelKey ?? cat;
}

export function categoryColor(cat: ServiceCategory) {
  return CATEGORIES.find((c) => c.key === cat)?.color ?? CATEGORY_BUTTON_CLASS;
}
