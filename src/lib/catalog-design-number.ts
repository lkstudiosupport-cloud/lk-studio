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

export function trailingCatalogIndex(catalogNumber: string): number | null {
  const match = catalogNumber.match(/(\d{4})$/);
  if (!match) return null;
  const n = parseInt(match[1]!, 10);
  return Number.isNaN(n) ? null : n;
}

/** Highest trailing index among codes sharing a prefix (e.g. MAG-, MAG-S-). */
export function maxCatalogIndexForPrefix(catalogNumbers: string[], prefix: string): number {
  let max = 0;
  for (const cn of catalogNumbers) {
    if (!cn.startsWith(`${prefix}-`)) continue;
    const index = trailingCatalogIndex(cn);
    if (index != null) max = Math.max(max, index);
  }
  return max;
}

function formatCatalogCode(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

async function nextUniqueCatalogNumber(
  prisma: Pick<PrismaClient, "design">,
  prefix: string,
  startIndex: number
): Promise<string> {
  let index = startIndex;
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const candidate = formatCatalogCode(prefix, index);
    const taken = await prisma.design.findFirst({
      where: { catalogNumber: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
    index++;
  }
  throw new Error("Could not allocate a new catalog design number");
}

async function listCategoryCatalogNumbers(
  prisma: Pick<PrismaClient, "design">,
  category: ServiceCategory
): Promise<string[]> {
  const rows = await prisma.design.findMany({
    where: { category, catalogNumber: { not: null } },
    select: { catalogNumber: true },
  });
  return rows.map((row) => row.catalogNumber!);
}

/**
 * Next unassigned code e.g. MAG-0101 (no S/M/B until admin assigns a size tier).
 * Counts every code in the category (including MAG-S-0100) so new uploads never reuse 0001.
 */
export async function nextCatalogDesignNumber(
  prisma: Pick<PrismaClient, "design">,
  category: ServiceCategory
): Promise<string> {
  const prefix = catalogCodePrefix(category);
  const numbers = await listCategoryCatalogNumbers(prisma, category);
  const max = maxCatalogIndexForPrefix(numbers, prefix);
  return nextUniqueCatalogNumber(prisma, prefix, max + 1);
}

/** Next tier code e.g. MAG-S-0101 or EMB-M-0042. */
export async function nextTierCatalogDesignNumber(
  prisma: Pick<PrismaClient, "design">,
  category: ServiceCategory,
  tier: DesignSizeTier
): Promise<string> {
  const prefix = tierCatalogCodePrefix(category, tier);
  const numbers = await listCategoryCatalogNumbers(prisma, category);
  const max = maxCatalogIndexForPrefix(numbers, prefix);
  return nextUniqueCatalogNumber(prisma, prefix, max + 1);
}

/** Next part code e.g. BLU-B-0101, DRS-H-0042. */
export async function nextPartCatalogDesignNumber(
  prisma: Pick<PrismaClient, "design">,
  category: ServiceCategory,
  part: CatalogPart
): Promise<string> {
  const prefix = partCatalogCodePrefix(category, part);
  const numbers = await listCategoryCatalogNumbers(prisma, category);
  const max = maxCatalogIndexForPrefix(numbers, prefix);
  return nextUniqueCatalogNumber(prisma, prefix, max + 1);
}
