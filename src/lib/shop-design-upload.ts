import { prisma } from "@/lib/prisma";
import { nextCatalogDesignNumber } from "@/lib/catalog-design-number";
import { saveCatalogDesignUpload, saveShopDesignUpload } from "@/lib/shop-storage";
import { MAX_DESIGN_IMAGES } from "@/lib/design-images";
import { isCatalogUploadCategory, isShopOwnedUploadCategory } from "@/lib/design-access";
import type { ServiceCategory } from "@prisma/client";

export async function persistShopDesign(
  shopId: string,
  shop: { shopName: string; shopCode: string },
  input: { category: ServiceCategory; title: string; files: File[] }
): Promise<{ catalogNumber?: string }> {
  const uploadFiles = input.files.filter((f) => f.size > 0);
  if (uploadFiles.length > MAX_DESIGN_IMAGES) {
    throw new Error(`Maximum ${MAX_DESIGN_IMAGES} photos per design`);
  }
  if (uploadFiles.length === 0) {
    throw new Error("Add at least one design photo");
  }

  if (isCatalogUploadCategory(input.category)) {
    return persistCatalogDesign(shopId, input.category, input.title, uploadFiles);
  }

  if (!isShopOwnedUploadCategory(input.category)) {
    throw new Error("Upload is not allowed for this category");
  }

  const paths = await Promise.all(
    uploadFiles.map((file) =>
      saveShopDesignUpload(shop.shopName, shop.shopCode, input.category, file)
    )
  );

  await prisma.design.create({
    data: {
      shopId,
      isCatalog: false,
      title: input.title.trim() || "Design",
      description: null,
      category: input.category,
      workType: "STITCHING",
      imagePath: paths[0],
      imagesJson: JSON.stringify(paths),
      active: true,
    },
  });

  return {};
}

async function persistCatalogDesign(
  shopId: string,
  category: ServiceCategory,
  title: string,
  uploadFiles: File[]
): Promise<{ catalogNumber: string }> {
  const catalogNumber = await nextCatalogDesignNumber(prisma, category);
  const paths = await Promise.all(
    uploadFiles.map((file) => saveCatalogDesignUpload(category, file))
  );

  await prisma.design.create({
    data: {
      isCatalog: true,
      shopId: null,
      uploadedByShopId: shopId,
      catalogNumber,
      title: title.trim() || catalogNumber,
      description: null,
      category,
      sizeTier: null,
      workType: "STITCHING",
      imagePath: paths[0]!,
      imagesJson: JSON.stringify(paths),
      active: true,
    },
  });

  return { catalogNumber };
}
