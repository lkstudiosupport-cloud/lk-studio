import type { DesignSizeTier, PrismaClient, ServiceCategory } from "@prisma/client";
import { CATALOG_CATEGORIES } from "../src/lib/design-access";

const PLACEHOLDER = "/placeholder-design.svg";

const CATALOG_SAMPLES: {
  title: string;
  category: ServiceCategory;
  sizeTier?: DesignSizeTier;
  catalogNumber?: string;
}[] = [
  { title: "Classic maggam border", category: "MAGGAM", sizeTier: "SMALL", catalogNumber: "MAG-S-0001" },
  { title: "Peacock maggam work", category: "MAGGAM", sizeTier: "MEDIUM", catalogNumber: "MAG-M-0001" },
  { title: "Temple maggam blouse", category: "MAGGAM", sizeTier: "BIG", catalogNumber: "MAG-B-0001" },
  {
    title: "Floral machine embroidery",
    category: "COMPUTER_EMBROIDERY",
    sizeTier: "SMALL",
    catalogNumber: "EMB-S-0001",
  },
  {
    title: "Zari computer work",
    category: "COMPUTER_EMBROIDERY",
    sizeTier: "MEDIUM",
    catalogNumber: "EMB-M-0001",
  },
  { title: "Designer model blouse 1", category: "BLOUSE_DESIGN" },
  { title: "Designer model blouse 2", category: "BLOUSE_DESIGN" },
  { title: "Anarkali dress model", category: "DRESS_MODEL" },
  { title: "Long frock model", category: "DRESS_MODEL" },
  { title: "Kids party wear", category: "CHILDREN_WEAR" },
  { title: "Kids lehenga model", category: "CHILDREN_WEAR" },
];

/** App-wide catalog designs — same for every shop (read-only). */
export async function seedCatalogDesigns(prisma: PrismaClient) {
  for (const sample of CATALOG_SAMPLES) {
    const exists = sample.catalogNumber
      ? await prisma.design.findFirst({ where: { catalogNumber: sample.catalogNumber } })
      : await prisma.design.findFirst({
          where: { isCatalog: true, category: sample.category, title: sample.title },
        });
    if (exists) continue;

    await prisma.design.create({
      data: {
        isCatalog: true,
        shopId: null,
        title: sample.title,
        category: sample.category,
        sizeTier: sample.sizeTier ?? null,
        catalogNumber: sample.catalogNumber ?? null,
        workType: "STITCHING",
        imagePath: PLACEHOLDER,
        active: true,
      },
    });
  }

  for (const category of CATALOG_CATEGORIES) {
    const count = await prisma.design.count({ where: { isCatalog: true, category, active: true } });
    if (count === 0) {
      await prisma.design.create({
        data: {
          isCatalog: true,
          shopId: null,
          title: `Sample ${category.replace(/_/g, " ").toLowerCase()}`,
          category,
          workType: "STITCHING",
          imagePath: PLACEHOLDER,
          active: true,
        },
      });
    }
  }
}
