import type { ServiceCategory } from "@prisma/client";
import { saveUpload } from "@/lib/upload";

/** Category subfolders inside each shop's upload directory. */
export const CATEGORY_STORAGE_FOLDERS: Record<ServiceCategory, string> = {
  MAGGAM: "maggam-work",
  COMPUTER_EMBROIDERY: "embroidery",
  BLOUSE_DESIGN: "blouse-models",
  DRESS_MODEL: "dress-models",
  CHILDREN_WEAR: "children-wear",
};

export function shopStorageSlug(shopName: string, shopCode: string) {
  const namePart = shopName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  const codePart = shopCode
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "");
  return `${namePart || "shop"}-${codePart || "main"}`;
}

export function shopDesignStoragePath(
  shopName: string,
  shopCode: string,
  category: ServiceCategory
) {
  const shopFolder = shopStorageSlug(shopName, shopCode);
  const categoryFolder = CATEGORY_STORAGE_FOLDERS[category];
  return `shops/${shopFolder}/${categoryFolder}`;
}

export async function saveShopDesignUpload(
  shopName: string,
  shopCode: string,
  category: ServiceCategory,
  file: File
) {
  const folder = shopDesignStoragePath(shopName, shopCode, category);
  return saveUpload(file, folder);
}
