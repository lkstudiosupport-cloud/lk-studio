import { prisma } from "@/lib/prisma";
import { nextPartCatalogDesignNumber } from "@/lib/catalog-design-number";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import type { CatalogPart } from "@prisma/client";

export async function assignCatalogDesignPart(
  designId: string,
  catalogPart: CatalogPart
): Promise<{ catalogNumber: string }> {
  const design = await prisma.design.findFirst({
    where: {
      id: designId,
      isCatalog: true,
      category: { in: CATALOG_CATEGORIES },
    },
  });

  if (!design) throw new Error("Design not found");
  if (!categoryHasCatalogParts(design.category)) {
    throw new Error("This category does not use catalog parts");
  }

  const catalogNumber = await nextPartCatalogDesignNumber(prisma, design.category, catalogPart);

  await prisma.design.update({
    where: { id: design.id },
    data: { catalogPart, catalogNumber },
  });

  return { catalogNumber };
}
