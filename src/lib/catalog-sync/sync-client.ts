import { applyCatalogSyncDelta, countNewDesigns } from "@/lib/catalog-sync/apply-delta";
import {
  idbDeleteDesigns,
  idbGetAllDesigns,
  idbGetSyncMetadata,
  idbPutCategoryCount,
  idbPutSyncMetadata,
  idbReplaceAllDesigns,
  idbUpsertDesigns,
  loadAutoUpdateSettings,
} from "@/lib/catalog-sync/idb";
import {
  detectNetworkKind,
  isBrowserOnline,
  shouldAutoSyncOnNetwork,
} from "@/lib/catalog-sync/network";
import type {
  CachedDesign,
  CatalogSyncDelta,
  SyncMetadata,
  SyncStatus,
} from "@/lib/catalog-sync/types";

/** Min gap between automatic syncs (10 minutes). Pull-to-refresh bypasses via force. */
export const CATALOG_SYNC_MIN_INTERVAL_MS = 10 * 60 * 1000;

type SyncListener = (state: {
  status: SyncStatus;
  newDesignCount: number;
  lastError?: string;
  designs: CachedDesign[];
  meta: SyncMetadata;
}) => void;

let syncLock = false;
let lastAttemptAt = 0;
let listeners = new Set<SyncListener>();
let lastStatus: SyncStatus = "idle";
let lastNewCount = 0;
let lastError: string | undefined;
let cachedDesigns: CachedDesign[] | null = null;
let cachedMeta: SyncMetadata | null = null;

function emit() {
  if (!cachedDesigns || !cachedMeta) return;
  const payload = {
    status: lastStatus,
    newDesignCount: lastNewCount,
    lastError,
    designs: cachedDesigns,
    meta: cachedMeta,
  };
  for (const l of listeners) l(payload);
}

export function subscribeCatalogSync(listener: SyncListener): () => void {
  listeners.add(listener);
  if (cachedDesigns && cachedMeta) {
    listener({
      status: lastStatus,
      newDesignCount: lastNewCount,
      lastError,
      designs: cachedDesigns,
      meta: cachedMeta,
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

export async function loadCatalogCache(): Promise<{
  designs: CachedDesign[];
  meta: SyncMetadata;
}> {
  const [designs, meta] = await Promise.all([idbGetAllDesigns(), idbGetSyncMetadata()]);
  cachedDesigns = designs;
  cachedMeta = meta;
  emit();
  return { designs, meta };
}

function refreshCategoryCounts(designs: CachedDesign[]) {
  const counts = new Map<string, number>();
  for (const d of designs) {
    if (!d.isCatalog) continue;
    counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
  }
  void Promise.all(
    [...counts.entries()].map(([key, count]) => idbPutCategoryCount(key, count))
  ).catch(() => {
    /* ignore */
  });
}

async function fetchSyncPage(version: number, page: number): Promise<CatalogSyncDelta> {
  const res = await fetch(`/api/catalog/designs/sync?version=${version}&page=${page}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await res.json()) as CatalogSyncDelta & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Sync failed");
  return data;
}

export type RunCatalogSyncOptions = {
  /** Bypass min-interval (pull-to-refresh / explicit). */
  force?: boolean;
  /** Ignore auto-update wifi/cellular prefs (still requires online). */
  ignoreNetworkPrefs?: boolean;
};

/**
 * Incremental catalog sync with lock + min interval.
 * Cache-first callers should `loadCatalogCache()` first, then call this in background.
 */
export async function runCatalogSync(
  options: RunCatalogSyncOptions = {}
): Promise<{
  status: SyncStatus;
  newDesignCount: number;
  designs: CachedDesign[];
  meta: SyncMetadata;
}> {
  if (syncLock) {
    const designs = cachedDesigns ?? (await idbGetAllDesigns());
    const meta = cachedMeta ?? (await idbGetSyncMetadata());
    return { status: lastStatus, newDesignCount: lastNewCount, designs, meta };
  }

  if (!isBrowserOnline()) {
    lastStatus = "offline";
    const loaded = await loadCatalogCache();
    emit();
    return {
      status: "offline",
      newDesignCount: 0,
      designs: loaded.designs,
      meta: loaded.meta,
    };
  }

  const settings = loadAutoUpdateSettings();
  const kind = detectNetworkKind();
  if (!options.ignoreNetworkPrefs && !shouldAutoSyncOnNetwork(kind, settings)) {
    const loaded = await loadCatalogCache();
    lastStatus = "idle";
    return {
      status: "idle",
      newDesignCount: 0,
      designs: loaded.designs,
      meta: loaded.meta,
    };
  }

  const now = Date.now();
  if (!options.force && lastAttemptAt && now - lastAttemptAt < CATALOG_SYNC_MIN_INTERVAL_MS) {
    const loaded = await loadCatalogCache();
    return {
      status: lastStatus === "updated" ? "idle" : lastStatus,
      newDesignCount: lastNewCount,
      designs: loaded.designs,
      meta: loaded.meta,
    };
  }

  syncLock = true;
  lastAttemptAt = now;
  lastStatus = "updating";
  lastError = undefined;
  emit();

  try {
    const meta = cachedMeta ?? (await idbGetSyncMetadata());
    const existing = cachedDesigns ?? (await idbGetAllDesigns());
    const previousIds = new Set(existing.map((d) => d.id));
    const map = new Map(existing.map((d) => [d.id, d]));

    let clientVersion = meta.fullSyncComplete ? meta.lastSyncedVersion : 0;
    let page = 1;
    let totalNew = 0;
    let latestVersion = meta.lastSyncedVersion;
    let fullSync = !meta.fullSyncComplete;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const delta = await fetchSyncPage(clientVersion, page);
      latestVersion = delta.currentVersion;

      if (!delta.hasChanges && !delta.fullSync) {
        break;
      }

      totalNew += countNewDesigns(previousIds, delta);
      const applied = applyCatalogSyncDelta(map, delta, {
        page,
        clearBeforeFullSyncPage1: true,
      });

      if (delta.fullSync && page === 1) {
        await idbReplaceAllDesigns([...applied.map.values()]);
      } else {
        await idbUpsertDesigns([...delta.added, ...delta.updated]);
        await idbDeleteDesigns(delta.deleted);
      }

      map.clear();
      for (const [k, v] of applied.map) map.set(k, v);

      if (delta.fullSync && delta.hasMore) {
        page += 1;
        continue;
      }
      fullSync = delta.fullSync ? true : meta.fullSyncComplete || fullSync;
      break;
    }

    const designs = [...map.values()];
    const nextMeta: SyncMetadata = {
      id: "global",
      lastSyncedVersion: latestVersion,
      lastSyncedAt: Date.now(),
      fullSyncComplete: fullSync || meta.fullSyncComplete || designs.length > 0,
    };
    await idbPutSyncMetadata(nextMeta);
    refreshCategoryCounts(designs);

    cachedDesigns = designs;
    cachedMeta = nextMeta;
    lastNewCount = totalNew;
    lastStatus = totalNew > 0 || designs !== existing ? "updated" : "idle";
    if (totalNew === 0 && !fullSync) lastStatus = "updated";
    emit();

    // Clear "updated" banner after a short delay for subscribers that care
    window.setTimeout(() => {
      if (lastStatus === "updated") {
        lastStatus = "idle";
        emit();
      }
    }, 4000);

    return {
      status: lastStatus,
      newDesignCount: totalNew,
      designs,
      meta: nextMeta,
    };
  } catch (e) {
    lastStatus = "error";
    lastError = e instanceof Error ? e.message : "Sync failed";
    const loaded = await loadCatalogCache();
    emit();
    return {
      status: "error",
      newDesignCount: 0,
      designs: loaded.designs,
      meta: loaded.meta,
    };
  } finally {
    syncLock = false;
  }
}

/** Seed IDB from SSR page-1 rows when cache is empty (online first paint). */
export async function seedCatalogCacheFromServer(
  items: CachedDesign[]
): Promise<void> {
  if (items.length === 0) return;
  const meta = await idbGetSyncMetadata();
  if (meta.fullSyncComplete) return;
  const existing = await idbGetAllDesigns();
  if (existing.length > 0) return;
  await idbUpsertDesigns(items);
  cachedDesigns = items;
  cachedMeta = meta;
  emit();
}
