import type { PrismaClient, ServiceCategory } from "@prisma/client";
import { CATALOG_CATEGORIES } from "../src/lib/design-access";

const PLACEHOLDER = "/placeholder-design.svg";

const CATALOG_SAMPLES: { title: string; category: ServiceCategory }[] = [
  { title: "Classic maggam border", category: "MAGGAM" },
  { title: "Peacock maggam work", category: "MAGGAM" },
  { title: "Temple maggam blouse", category: "MAGGAM" },
  { title: "Floral machine embroidery", category: "COMPUTER_EMBROIDERY" },
  { title: "Zari computer work", category: "COMPUTER_EMBROIDERY" },
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
    const exists = await prisma.design.findFirst({
      where: { isCatalog: true, category: sample.category, title: sample.title },
    });
    if (exists) continue;

    await prisma.design.create({
      data: {
        isCatalog: true,
        shopId: null,
        title: sample.title,
        category: sample.category,
        workType: "STITCHING",
        imagePath: PLACEHOLDER,
        active: true,
      },
    });
  }

  // Ensure every catalog category has at least one design
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
