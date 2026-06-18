import { prisma } from "@/lib/prisma";
import { nextCatalogDesignNumber } from "@/lib/catalog-design-number";
import { saveCatalogDesignUpload, saveShopDesignUpload } from "@/lib/shop-storage";
import { MAX_DESIGN_IMAGES } from "@/lib/design-images";
import {
  isCatalogUploadCategory,
  isShopOwnedUploadCategory,
  isShopUploadCategory,
} from "@/lib/design-access";
import type { DesignSizeTier, ServiceCategory } from "@prisma/client";

export async function persistShopDesign(
  shopId: string,
  shop: { shopName: string; shopCode: string },
  input: { category: ServiceCategory; title: string; files: File[]; sizeTier?: DesignSizeTier }
) {
  if (!isShopUploadCategory(input.category)) {
    throw new Error("Upload not allowed for this category");
  }

  if (isCatalogUploadCategory(input.category)) {
    return persistCatalogDesign(shopId, shop, input);
  }

  if (!isShopOwnedUploadCategory(input.category)) {
    throw new Error("Upload is only allowed for Stitched designs");
  }

  const uploadFiles = input.files.filter((f) => f.size > 0);
  if (uploadFiles.length > MAX_DESIGN_IMAGES) {
    throw new Error(`Maximum ${MAX_DESIGN_IMAGES} photos per design`);
  }
  if (uploadFiles.length === 0) {
    throw new Error("Add at least one design photo");
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
}

async function persistCatalogDesign(
  shopId: string,
  shop: { shopName: string; shopCode: string },
  input: { category: ServiceCategory; title: string; files: File[]; sizeTier?: DesignSizeTier }
) {
  if (!isCatalogUploadCategory(input.category)) {
    throw new Error("Invalid catalog category");
  }
  if (!input.sizeTier) {
    throw new Error("Select size: Small, Medium, or Big");
  }

  const uploadFiles = input.files.filter((f) => f.size > 0);
  if (uploadFiles.length > MAX_DESIGN_IMAGES) {
    throw new Error(`Maximum ${MAX_DESIGN_IMAGES} photos per design`);
  }
  if (uploadFiles.length === 0) {
    throw new Error("Add at least one design photo");
  }

  const catalogNumber = await nextCatalogDesignNumber(prisma, input.category, input.sizeTier);

  const paths = await Promise.all(
    uploadFiles.map((file) =>
      saveCatalogDesignUpload(input.category, input.sizeTier!, file)
    )
  );

  await prisma.design.create({
    data: {
      shopId: null,
      isCatalog: true,
      uploadedByShopId: shopId,
      catalogNumber,
      sizeTier: input.sizeTier,
      title: input.title.trim() || catalogNumber,
      description: null,
      category: input.category,
      workType: "STITCHING",
      imagePath: paths[0],
      imagesJson: JSON.stringify(paths),
      active: true,
    },
  });
}
