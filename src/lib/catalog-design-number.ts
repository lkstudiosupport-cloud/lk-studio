import type { CatalogPart, DesignSizeTier, PrismaClient, ServiceCategory } from "@prisma/client";

/** App-assigned design codes for catalog uploads (no size tier). */
export const CATALOG_CODE_PREFIX: Partial<Record<ServiceCategory, string>> = {
  MAGGAM: "MAG",
  COMPUTER_EMBROIDERY: "EMB",
  BLOUSE_DESIGN: "BLU",
  DRESS_MODEL: "DRS",
  CHILDREN_WEAR: "KID",
};

const TIER_LETTER: Record<DesignSizeTier, string> = {
  SMALL: "S",
  MEDIUM: "M",
  BIG: "B",
};

export function catalogCodePrefix(category: ServiceCategory): string {
  const prefix = CATALOG_CODE_PREFIX[category];
  if (!prefix) throw new Error("This category does not use catalog design codes");
  return prefix;
}

export function tierCatalogCodePrefix(category: ServiceCategory, tier: DesignSizeTier): string {
  return `${catalogCodePrefix(category)}-${TIER_LETTER[tier]}`;
}


/** BLU-B / BLU-H for blouse; DRS-D / DRS-H for dress (MAIN uses category-specific letter). */
export function partCatalogCodePrefix(category: ServiceCategory, part: CatalogPart): string {
  const base = catalogCodePrefix(category);
  if (part === "HAND_SLEEVES") return `${base}-H`;
  if (category === "BLOUSE_DESIGN") return `${base}-B`;
  if (category === "DRESS_MODEL") return `${base}-D`;
  throw new Error("This category does not use catalog parts");
}

function isAssignedSubgroupCode(catalogNumber: string): boolean {
  return /^[A-Z]+-[A-Z]-\d{4}$/.test(catalogNumber);
}

function trailingCatalogIndex(catalogNumber: string): number | null {
  const match = catalogNumber.match(/(\d{4})$/);
  if (!match) return null;
  const n = parseInt(match[1]!, 10);
  return Number.isNaN(n) ? null : n;
}

/** Next unassigned code e.g. MAG-0101 (no S/M/B — until admin assigns a size tier). */
export async function nextCatalogDesignNumber(
  prisma: Pick<PrismaClient, "design">,
  category: ServiceCategory
): Promise<string> {
  const prefix = catalogCodePrefix(category);
  const existing = await prisma.design.findMany({
    where: { category, catalogNumber: { not: null } },
    select: { catalogNumber: true },
  });

  let max = 0;
  for (const row of existing) {
    const cn = row.catalogNumber!;
    if (!cn.startsWith(`${prefix}-`)) continue;
    if (isAssignedSubgroupCode(cn)) continue;
    const index = trailingCatalogIndex(cn);
    if (index != null) max = Math.max(max, index);
  }

  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

/** Next tier code e.g. MAG-S-0101 or EMB-M-0042. */
export async function nextTierCatalogDesignNumber(
  prisma: Pick<PrismaClient, "design">,
  category: ServiceCategory,
  tier: DesignSizeTier
): Promise<string> {
  const prefix = tierCatalogCodePrefix(category, tier);
  const existing = await prisma.design.findMany({
    where: { category, sizeTier: tier, catalogNumber: { not: null } },
    select: { catalogNumber: true },
  });

  let max = 0;
  for (const row of existing) {
    const cn = row.catalogNumber!;
    if (!cn.startsWith(`${prefix}-`)) continue;
    const index = trailingCatalogIndex(cn);
    if (index != null) max = Math.max(max, index);
  }

  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

/** Next part code e.g. BLU-B-0101, DRS-H-0042. */
export async function nextPartCatalogDesignNumber(
  prisma: Pick<PrismaClient, "design">,
  category: ServiceCategory,
  part: CatalogPart
): Promise<string> {
  const prefix = partCatalogCodePrefix(category, part);
  const existing = await prisma.design.findMany({
    where: { category, catalogPart: part, catalogNumber: { not: null } },
    select: { catalogNumber: true },
  });

  let max = 0;
  for (const row of existing) {
    const cn = row.catalogNumber!;
    if (!cn.startsWith(`${prefix}-`)) continue;
    const index = trailingCatalogIndex(cn);
    if (index != null) max = Math.max(max, index);
  }

  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}
