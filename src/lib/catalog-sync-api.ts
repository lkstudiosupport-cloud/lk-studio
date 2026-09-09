import type { Prisma } from "@prisma/client";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { designListSelect, type DesignListItem } from "@/lib/design-list-select";
import { ensureCatalogSyncReady } from "@/lib/catalog-sync-version";
import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/safe-db";

export type CatalogSyncDesignDto = Omit<DesignListItem, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt?: string;
};

export type CatalogSyncResponse = {
  currentVersion: number;
  hasChanges: boolean;
  /** True when client should replace/merge a full catalog page stream (version was 0). */
  fullSync: boolean;
  added: CatalogSyncDesignDto[];
  updated: CatalogSyncDesignDto[];
  deleted: string[];
  page: number;
  hasMore: boolean;
};

const FULL_SYNC_PAGE_SIZE = 200;

function toDto(row: DesignListItem & { updatedAt?: Date }): CatalogSyncDesignDto {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString?.() ?? undefined,
  };
}

const syncSelect = {
  ...designListSelect,
  updatedAt: true,
  syncVersion: true,
  createdSyncVersion: true,
} satisfies Prisma.DesignSelect;

type SyncRow = Prisma.DesignGetPayload<{ select: typeof syncSelect }>;

function toListItem(row: SyncRow): DesignListItem & { updatedAt: Date } {
  const { syncVersion: _s, createdSyncVersion: _c, ...rest } = row;
  return rest;
}

/**
 * Incremental (or first-install full) catalog sync payload.
 * version=0 → paginated full dump as `added`.
 * version=N → delta since N (added / updated / deleted).
 */
export async function buildCatalogSyncResponse(
  clientVersion: number,
  page = 1
): Promise<CatalogSyncResponse> {
  const currentVersion = await ensureCatalogSyncReady();
  const p = Math.max(1, Math.floor(page) || 1);

  if (clientVersion >= currentVersion) {
    return {
      currentVersion,
      hasChanges: false,
      fullSync: false,
      added: [],
      updated: [],
      deleted: [],
      page: 1,
      hasMore: false,
    };
  }

  const catalogWhere: Prisma.DesignWhereInput = {
    isCatalog: true,
    active: true,
    category: { in: CATALOG_CATEGORIES },
  };

  if (clientVersion <= 0) {
    const skip = (p - 1) * FULL_SYNC_PAGE_SIZE;
    const rows = await withDbRetry(() =>
      prisma.design.findMany({
        where: catalogWhere,
        select: syncSelect,
        orderBy: [{ catalogNumber: "asc" }, { createdAt: "desc" }],
        skip,
        take: FULL_SYNC_PAGE_SIZE + 1,
      })
    );
    const hasMore = rows.length > FULL_SYNC_PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, FULL_SYNC_PAGE_SIZE) : rows;
    return {
      currentVersion,
      hasChanges: true,
      fullSync: true,
      added: pageRows.map((r) => toDto(toListItem(r))),
      updated: [],
      deleted: [],
      page: p,
      hasMore,
    };
  }

  const [changed, deletedRows] = await withDbRetry(() =>
    Promise.all([
      prisma.design.findMany({
        where: {
          ...catalogWhere,
          syncVersion: { gt: clientVersion },
        },
        select: syncSelect,
        orderBy: [{ catalogNumber: "asc" }, { createdAt: "desc" }],
      }),
      prisma.designDeletion.findMany({
        where: { version: { gt: clientVersion } },
        select: { id: true },
      }),
    ])
  );

  const added: CatalogSyncDesignDto[] = [];
  const updated: CatalogSyncDesignDto[] = [];
  for (const row of changed) {
    const dto = toDto(toListItem(row));
    if (row.createdSyncVersion > clientVersion) added.push(dto);
    else updated.push(dto);
  }

  return {
    currentVersion,
    hasChanges: added.length > 0 || updated.length > 0 || deletedRows.length > 0,
    fullSync: false,
    added,
    updated,
    deleted: deletedRows.map((d) => d.id),
    page: 1,
    hasMore: false,
  };
}
