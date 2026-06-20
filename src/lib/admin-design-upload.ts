import { prisma } from "@/lib/prisma";
import { nextCatalogDesignNumber } from "@/lib/catalog-design-number";
import { saveCatalogDesignUpload } from "@/lib/shop-storage";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import type { ServiceCategory } from "@prisma/client";

export function isAdminCatalogCategory(category: ServiceCategory): boolean {
  return CATALOG_CATEGORIES.includes(category);
}

/** LK Studio admin catalog — one photo → one design code (MAG-0001, EMB-0001, …). */
export async function persistAdminCatalogDesign(
  category: ServiceCategory,
  file: File,
  title?: string
): Promise<{ catalogNumber: string }> {
  if (!isAdminCatalogCategory(category)) {
    throw new Error("This category is not an app catalog category");
  }
  if (!file.size) throw new Error("Add at least one design photo");

  const catalogNumber = await nextCatalogDesignNumber(prisma, category);
  const imagePath = await saveCatalogDesignUpload(category, file);

  await prisma.design.create({
    data: {
      isCatalog: true,
      shopId: null,
      uploadedByShopId: null,
      catalogNumber,
      title: title?.trim() || catalogNumber,
      description: null,
      category,
      sizeTier: null,
      workType: "STITCHING",
      imagePath,
      imagesJson: JSON.stringify([imagePath]),
      active: true,
    },
  });

  return { catalogNumber };
}
