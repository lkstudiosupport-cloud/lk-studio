import type { DesignSizeTier, PrismaClient, ServiceCategory } from "@prisma/client";

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
    // Skip tier codes MAG-S-0001 — only count flat MAG-0001 style
    if (/^[A-Z]+-[SMB]-\d{4}$/.test(cn)) continue;
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
