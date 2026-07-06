import type { CatalogPart, ServiceCategory } from "@prisma/client";

export const CATALOG_PARTS: CatalogPart[] = ["MAIN", "HAND_SLEEVES"];

/** Model blouse & dress model — blouses/dress vs hand (sleeves). */
export const CATALOG_PART_CATEGORIES: ServiceCategory[] = ["BLOUSE_DESIGN", "DRESS_MODEL"];

export function categoryHasCatalogParts(category: ServiceCategory): boolean {
  return CATALOG_PART_CATEGORIES.includes(category);
}

/** Default part — blouses for model blouse, dress design for dress model. */
export function defaultCatalogPartForCategory(
  category: ServiceCategory
): CatalogPart | undefined {
  return categoryHasCatalogParts(category) ? "MAIN" : undefined;
}

export function catalogPartLabelKey(category: ServiceCategory, part: CatalogPart): string {
  if (part === "HAND_SLEEVES") return "catalogPartHandSleeves";
  if (category === "BLOUSE_DESIGN") return "catalogPartBlouses";
  return "catalogPartDressDesign";
}
