import type { Prisma } from "@prisma/client";

/** Fields needed for design grids (shop gallery, customer catalog cards). */
export const designListSelect = {
  id: true,
  shopId: true,
  isCatalog: true,
  catalogNumber: true,
  title: true,
  imagePath: true,
  imagesJson: true,
  category: true,
  createdAt: true,
  sizeTier: true,
  catalogPart: true,
} satisfies Prisma.DesignSelect;

export type DesignListItem = Prisma.DesignGetPayload<{ select: typeof designListSelect }>;
