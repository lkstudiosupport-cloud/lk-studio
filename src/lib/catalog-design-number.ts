import type { DesignSizeTier, PrismaClient, ServiceCategory } from "@prisma/client";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";

const PREFIX: Record<ServiceCategory, Record<DesignSizeTier, string> | null> = {
  MAGGAM: { SMALL: "MAG-S", MEDIUM: "MAG-M", BIG: "MAG-B" },
  COMPUTER_EMBROIDERY: { SMALL: "EMB-S", MEDIUM: "EMB-M", BIG: "EMB-B" },
  BLOUSE_DESIGN: null,
  DRESS_MODEL: null,
  CHILDREN_WEAR: null,
  STITCHED_DESIGNS: null,
};

export function catalogNumberPrefix(category: ServiceCategory, sizeTier: DesignSizeTier): string {
  const p = PREFIX[category]?.[sizeTier];
  if (!p) throw new Error("Catalog numbers apply only to Maggam and Computer embroidery");
  return p;
}

export async function nextCatalogDesignNumber(
  prisma: Pick<PrismaClient, "design">,
  category: ServiceCategory,
  sizeTier: DesignSizeTier
): Promise<string> {
  if (!categoryHasSizeTiers(category)) {
    throw new Error("Invalid category for catalog number");
  }
  const prefix = catalogNumberPrefix(category, sizeTier);
  const latest = await prisma.design.findFirst({
    where: { category, sizeTier, catalogNumber: { startsWith: `${prefix}-` } },
    select: { catalogNumber: true },
    orderBy: { catalogNumber: "desc" },
  });

  let next = 1;
  if (latest?.catalogNumber) {
    const tail = latest.catalogNumber.slice(prefix.length + 1);
    const parsed = parseInt(tail, 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }

  return `${prefix}-${String(next).padStart(4, "0")}`;
}
