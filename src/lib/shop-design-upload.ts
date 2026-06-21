import { prisma } from "@/lib/prisma";
import { saveShopDesignUpload } from "@/lib/shop-storage";
import { MAX_DESIGN_IMAGES } from "@/lib/design-images";
import { isShopOwnedUploadCategory } from "@/lib/design-access";
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

  if (!isShopOwnedUploadCategory(input.category)) {
    throw new Error("Only stitched designs can be uploaded by shops. Catalog categories are admin-only.");
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
