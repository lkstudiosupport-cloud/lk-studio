import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";

export type CatalogBrowseQuery = {
  category: ServiceCategory;
  sizeTier?: DesignSizeTier;
  catalogPart?: CatalogPart;
};

/** Client-safe query string for /api/catalog/designs (no server imports). */
export function catalogBrowseApiQuery(query: CatalogBrowseQuery & { mode?: string }): string {
  const params = new URLSearchParams({ category: query.category });
  if (query.sizeTier) params.set("size", query.sizeTier);
  if (query.catalogPart) params.set("part", query.catalogPart);
  if (query.mode) params.set("mode", query.mode);
  return params.toString();
}
