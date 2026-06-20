import type { DesignSizeTier, ServiceCategory } from "@prisma/client";

export const DESIGN_SIZE_TIERS: DesignSizeTier[] = ["SMALL", "MEDIUM", "BIG"];

/** Size tiers are no longer used in the UI — designs are grouped by category only. */
export const SIZE_TIER_CATEGORIES: ServiceCategory[] = [];

export function categoryHasSizeTiers(_category: ServiceCategory): boolean {
  return false;
}

export function sizeTierLabelKey(tier: DesignSizeTier): string {
  const map: Record<DesignSizeTier, string> = {
    SMALL: "sizeTier.small",
    MEDIUM: "sizeTier.medium",
    BIG: "sizeTier.big",
  };
  return map[tier];
}
