import { prisma } from "@/lib/prisma";
import { nextTierCatalogDesignNumber } from "@/lib/catalog-design-number";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import type { DesignSizeTier } from "@prisma/client";

export async function assignCatalogDesignSizeTier(
  designId: string,
  sizeTier: DesignSizeTier
): Promise<{ catalogNumber: string }> {
  const design = await prisma.design.findFirst({
    where: {
      id: designId,
      isCatalog: true,
      category: { in: CATALOG_CATEGORIES },
    },
  });

  if (!design) throw new Error("Design not found");
  if (!categoryHasSizeTiers(design.category)) {
    throw new Error("This category does not use size tiers");
  }

  const catalogNumber = await nextTierCatalogDesignNumber(prisma, design.category, sizeTier);

  await prisma.design.update({
    where: { id: design.id },
    data: { sizeTier, catalogNumber },
  });

  return { catalogNumber };
}
