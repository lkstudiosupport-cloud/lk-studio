import type { Prisma } from "@prisma/client";

/** Fields needed for design list cards — avoids loading unused columns. */
export const DESIGN_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  catalogNumber: true,
  imagePath: true,
  imagesJson: true,
  shopId: true,
  isCatalog: true,
  active: true,
  createdAt: true,
  sizeTier: true,
} satisfies Prisma.DesignSelect;

export type DesignListItem = Prisma.DesignGetPayload<{ select: typeof DESIGN_CARD_SELECT }>;
