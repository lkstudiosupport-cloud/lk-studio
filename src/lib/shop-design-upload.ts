import { prisma } from "@/lib/prisma";
import { saveShopDesignUpload } from "@/lib/shop-storage";
import { MAX_DESIGN_IMAGES } from "@/lib/design-images";
import type { ServiceCategory } from "@prisma/client";

export async function persistShopDesign(
  shopId: string,
  shop: { shopName: string; shopCode: string },
  input: { category: ServiceCategory; title: string; files: File[] }
) {
  const uploadFiles = input.files.filter((f) => f.size > 0);
  if (uploadFiles.length > MAX_DESIGN_IMAGES) {
    throw new Error(`Maximum ${MAX_DESIGN_IMAGES} photos per design`);
  }
  if (uploadFiles.length === 0) throw new Error("Add at least one design photo");

  const paths = await Promise.all(
    uploadFiles.map((file) =>
      saveShopDesignUpload(shop.shopName, shop.shopCode, input.category, file)
    )
  );

  await prisma.design.create({
    data: {
      shopId,
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
