import { prisma } from "@/lib/prisma";
import {
  nextCatalogDesignNumber,
  nextPartCatalogDesignNumber,
  nextTierCatalogDesignNumber,
} from "@/lib/catalog-design-number";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { saveCatalogDesignUpload } from "@/lib/shop-storage";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";

export function isAdminCatalogCategory(category: ServiceCategory): boolean {
  return CATALOG_CATEGORIES.includes(category);
}

export type AdminCatalogUploadOptions = {
  title?: string;
  sizeTier?: DesignSizeTier | null;
  catalogPart?: CatalogPart | null;
};

/** LK Studio admin catalog — one photo → one design code (MAG-S-0001, EMB-M-0001, …). */
export async function persistAdminCatalogDesign(
  category: ServiceCategory,
  file: File,
  options?: AdminCatalogUploadOptions
): Promise<{ catalogNumber: string }> {
  if (!isAdminCatalogCategory(category)) {
    throw new Error("This category is not an app catalog category");
  }
  if (!file.size) throw new Error("Add at least one design photo");

  const title = options?.title?.trim();
  let catalogNumber: string;
  let imagePath: string;
  let sizeTier: DesignSizeTier | null = null;
  let catalogPart: CatalogPart | null = null;

  if (categoryHasSizeTiers(category)) {
    const tier = options?.sizeTier;
    if (!tier) {
      throw new Error("Choose Small, Medium, or Big before upload");
    }
    sizeTier = tier;
    catalogNumber = await nextTierCatalogDesignNumber(prisma, category, tier);
    imagePath = await saveCatalogDesignUpload(category, file, tier);
  } else if (categoryHasCatalogParts(category)) {
    const part = options?.catalogPart;
    if (!part) {
      throw new Error("Choose Blouses or Hand sleeves before upload");
    }
    catalogPart = part;
    catalogNumber = await nextPartCatalogDesignNumber(prisma, category, part);
    imagePath = await saveCatalogDesignUpload(category, file);
  } else {
    catalogNumber = await nextCatalogDesignNumber(prisma, category);
    imagePath = await saveCatalogDesignUpload(category, file);
  }

  await prisma.design.create({
    data: {
      isCatalog: true,
      shopId: null,
      uploadedByShopId: null,
      catalogNumber,
      title: title || catalogNumber,
      description: null,
      category,
      sizeTier,
      catalogPart,
      workType: "STITCHING",
      imagePath,
      imagesJson: JSON.stringify([imagePath]),
      active: true,
    },
  });

  return { catalogNumber };
}
