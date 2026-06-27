import { cache } from "react";
import { fetchCatalogDesignPage } from "@/lib/catalog-design-list";
import { appCatalogDesignsWhere } from "@/lib/design-access";

/** @deprecated Prefer fetchCatalogDesignPage — returns first page only. */
export const cachedAppCatalogDesigns = cache(async () => {
  const page = await fetchCatalogDesignPage({ where: appCatalogDesignsWhere(), page: 1 });
  return page.items;
});
