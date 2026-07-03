import type { Prisma } from "@prisma/client";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import {
  catalogBrowseApiQuery,
  type CatalogBrowseQuery,
} from "@/lib/catalog-browse-query";

export { catalogBrowseApiQuery, type CatalogBrowseQuery };
import { prisma } from "@/lib/prisma";
import {
  isShopOwnedUploadCategory,
  shopStitchedDesignsWhere,
  sortedCatalogDesignWhere,
} from "@/lib/design-access";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { designListSelect, type DesignListItem } from "@/lib/design-list-select";
import { CATALOG_MAX_PAGE, CATALOG_PAGE_SIZE } from "@/lib/limits";
import { withDbRetry } from "@/lib/safe-db";

export type CatalogDesignPageResult = {
  items: DesignListItem[];
  /** Omitted on page > 1 — client keeps the total from page 1. */
  total: number | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type CatalogAdminQuery = {
  category: ServiceCategory;
  /** unassigned | SMALL | MEDIUM | BIG */
  sizeView?: "unassigned" | DesignSizeTier;
  /** unassigned | MAIN | HAND_SLEEVES */
  partView?: "unassigned" | CatalogPart;
};

const designOrderBy = [{ catalogNumber: "asc" as const }, { createdAt: "desc" as const }];

export function catalogBrowseWhere(query: CatalogBrowseQuery): Prisma.DesignWhereInput {
  const base = sortedCatalogDesignWhere(query.category);
  if (categoryHasSizeTiers(query.category) && query.sizeTier) {
    return { ...base, sizeTier: query.sizeTier };
  }
  if (categoryHasCatalogParts(query.category) && query.catalogPart) {
    return { ...base, catalogPart: query.catalogPart };
  }
  return base;
}

export function catalogAdminWhere(query: CatalogAdminQuery): Prisma.DesignWhereInput {
  const base: Prisma.DesignWhereInput = {
    isCatalog: true,
    category: query.category,
    active: true,
  };

  if (categoryHasSizeTiers(query.category)) {
    const view = query.sizeView ?? "unassigned";
    if (view === "unassigned") return { ...base, sizeTier: null };
    return { ...base, sizeTier: view };
  }

  if (categoryHasCatalogParts(query.category)) {
    const view = query.partView ?? "unassigned";
    if (view === "unassigned") return { ...base, catalogPart: null };
    return { ...base, catalogPart: view };
  }

  return base;
}

export function shopDesignsWhere(
  shopId: string,
  query: CatalogBrowseQuery
): Prisma.DesignWhereInput {
  if (isShopOwnedUploadCategory(query.category)) {
    return shopStitchedDesignsWhere(shopId);
  }
  return catalogBrowseWhere(query);
}

function clampPage(page: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), CATALOG_MAX_PAGE);
}

function findDesignPage(where: Prisma.DesignWhereInput, skip: number, take: number) {
  return withDbRetry(() =>
    prisma.design.findMany({
      where,
      select: designListSelect,
      orderBy: designOrderBy,
      skip,
      take,
    })
  );
}

export async function fetchCatalogDesignPage({
  where,
  page = 1,
  pageSize = CATALOG_PAGE_SIZE,
}: {
  where: Prisma.DesignWhereInput;
  page?: number;
  pageSize?: number;
}): Promise<CatalogDesignPageResult> {
  const p = clampPage(page);
  const take = Math.min(Math.max(pageSize, 1), CATALOG_PAGE_SIZE);
  const skip = (p - 1) * take;

  if (p === 1) {
    const [items, total] = await Promise.all([
      findDesignPage(where, skip, take),
      withDbRetry(() => prisma.design.count({ where })),
    ]);
    return {
      items,
      total,
      page: p,
      pageSize: take,
      hasMore: skip + items.length < total,
    };
  }

  /** Page 2+: skip COUNT (slow on large catalogs) — fetch one extra row for hasMore. */
  const rows = await findDesignPage(where, skip, take + 1);
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;

  return {
    items,
    total: null,
    page: p,
    pageSize: take,
    hasMore,
  };
}

export function parseCatalogPage(raw?: string): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return clampPage(n);
}

export function parseSizeTier(raw?: string): DesignSizeTier | undefined {
  const u = raw?.toUpperCase();
  if (u === "SMALL" || u === "MEDIUM" || u === "BIG") return u;
  return undefined;
}

export function parseCatalogPart(raw?: string): CatalogPart | undefined {
  const u = raw?.toUpperCase();
  if (u === "MAIN" || u === "HAND_SLEEVES") return u;
  return undefined;
}

export function parseAdminSizeView(raw?: string): CatalogAdminQuery["sizeView"] {
  const u = raw?.toLowerCase();
  if (u === "unassigned" || !u) return "unassigned";
  const tier = parseSizeTier(raw);
  return tier ?? "unassigned";
}

export function parseAdminPartView(raw?: string): CatalogAdminQuery["partView"] {
  const u = raw?.toLowerCase();
  if (u === "unassigned" || !u) return "unassigned";
  const part = parseCatalogPart(raw);
  return part ?? "unassigned";
}

export function catalogAdminApiQuery(query: CatalogAdminQuery): string {
  const params = new URLSearchParams({ category: query.category, mode: "admin" });
  if (query.sizeView) params.set("sizeView", query.sizeView);
  if (query.partView) params.set("partView", query.partView);
  return params.toString();
}
