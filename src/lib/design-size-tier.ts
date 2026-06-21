import type { DesignSizeTier, ServiceCategory } from "@prisma/client";

export const DESIGN_SIZE_TIERS: DesignSizeTier[] = ["SMALL", "MEDIUM", "BIG"];

/** Maggam & computer embroidery — small / medium / big groupings. */
export const SIZE_TIER_CATEGORIES: ServiceCategory[] = ["MAGGAM", "COMPUTER_EMBROIDERY"];

export function categoryHasSizeTiers(category: ServiceCategory): boolean {
  return SIZE_TIER_CATEGORIES.includes(category);
}

export function sizeTierLabelKey(tier: DesignSizeTier): string {
  const map: Record<DesignSizeTier, string> = {
    SMALL: "sizeTier.small",
    MEDIUM: "sizeTier.medium",
    BIG: "sizeTier.big",
  };
  return map[tier];
}
