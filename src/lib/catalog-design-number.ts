import type { PrismaClient, ServiceCategory } from "@prisma/client";

/** App-assigned design codes for catalog uploads (no size tier). */
export const CATALOG_CODE_PREFIX: Partial<Record<ServiceCategory, string>> = {
  MAGGAM: "MAG",
  COMPUTER_EMBROIDERY: "EMB",
};

export function catalogCodePrefix(category: ServiceCategory): string {
  const prefix = CATALOG_CODE_PREFIX[category];
  if (!prefix) throw new Error("This category does not use catalog design codes");
  return prefix;
}

function trailingCatalogIndex(catalogNumber: string): number | null {
  const match = catalogNumber.match(/(\d{4})$/);
  if (!match) return null;
  const n = parseInt(match[1]!, 10);
  return Number.isNaN(n) ? null : n;
}

/** Next code e.g. MAG-0101 (continues after legacy MAG-S-0001 … MAG-S-0100). */
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
    if (!cn.startsWith(prefix)) continue;
    const index = trailingCatalogIndex(cn);
    if (index != null) max = Math.max(max, index);
  }

  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}
