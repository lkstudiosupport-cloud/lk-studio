import type { CachedDesign, CatalogSyncDelta } from "@/lib/catalog-sync/types";

/** Pure merge of an incremental (or full-page) sync delta into an in-memory design map. */
export function applyCatalogSyncDelta(
  existing: Map<string, CachedDesign>,
  delta: Pick<CatalogSyncDelta, "added" | "updated" | "deleted" | "fullSync">,
  options?: { clearBeforeFullSyncPage1?: boolean; page?: number }
): { map: Map<string, CachedDesign>; addedCount: number; updatedCount: number; deletedCount: number } {
  const map = new Map(existing);

  if (delta.fullSync && (options?.page ?? 1) === 1 && options?.clearBeforeFullSyncPage1 !== false) {
    map.clear();
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const row of delta.added) {
    const had = map.has(row.id);
    map.set(row.id, row);
    if (had) updatedCount += 1;
    else addedCount += 1;
  }
  for (const row of delta.updated) {
    const had = map.has(row.id);
    map.set(row.id, row);
    if (had) updatedCount += 1;
    else addedCount += 1;
  }
  for (const id of delta.deleted) {
    map.delete(id);
  }

  return {
    map,
    addedCount,
    updatedCount,
    deletedCount: delta.deleted.length,
  };
}

export function countNewDesigns(
  previousIds: Set<string>,
  delta: Pick<CatalogSyncDelta, "added">
): number {
  let n = 0;
  for (const row of delta.added) {
    if (!previousIds.has(row.id)) n += 1;
  }
  return n;
}
