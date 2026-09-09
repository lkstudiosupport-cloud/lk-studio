import type {
  AutoUpdateDesignsSettings,
  CachedDesign,
  DownloadedAsset,
  SyncMetadata,
} from "@/lib/catalog-sync/types";

const DB_NAME = "lk-studio-catalog";
const DB_VERSION = 1;

const STORE_DESIGNS = "designs";
const STORE_CATEGORIES = "categories";
const STORE_SYNC = "sync_metadata";
const STORE_ASSETS = "downloaded_assets";

const MAX_ASSET_BYTES = 40 * 1024 * 1024; // ~40MB thumb cache cap

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_DESIGNS)) {
        const designs = db.createObjectStore(STORE_DESIGNS, { keyPath: "id" });
        designs.createIndex("category", "category", { unique: false });
        designs.createIndex("catalogNumber", "catalogNumber", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC)) {
        db.createObjectStore(STORE_SYNC, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: "url" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export async function idbGetAllDesigns(): Promise<CachedDesign[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_DESIGNS, "readonly");
    const rows = await reqToPromise(tx.objectStore(STORE_DESIGNS).getAll());
    await txDone(tx);
    return (rows as CachedDesign[]) ?? [];
  } finally {
    db.close();
  }
}

export async function idbGetSyncMetadata(): Promise<SyncMetadata> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_SYNC, "readonly");
    const row = await reqToPromise(tx.objectStore(STORE_SYNC).get("global"));
    await txDone(tx);
    if (row) return row as SyncMetadata;
    return {
      id: "global",
      lastSyncedVersion: 0,
      lastSyncedAt: null,
      fullSyncComplete: false,
    };
  } finally {
    db.close();
  }
}

export async function idbPutSyncMetadata(meta: SyncMetadata): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_SYNC, "readwrite");
    tx.objectStore(STORE_SYNC).put(meta);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function idbReplaceAllDesigns(designs: CachedDesign[]): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_DESIGNS, "readwrite");
    const store = tx.objectStore(STORE_DESIGNS);
    store.clear();
    for (const d of designs) store.put(d);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function idbUpsertDesigns(designs: CachedDesign[]): Promise<void> {
  if (designs.length === 0) return;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_DESIGNS, "readwrite");
    const store = tx.objectStore(STORE_DESIGNS);
    for (const d of designs) store.put(d);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function idbDeleteDesigns(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_DESIGNS, "readwrite");
    const store = tx.objectStore(STORE_DESIGNS);
    for (const id of ids) store.delete(id);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function idbPutCategoryCount(
  key: string,
  count: number
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_CATEGORIES, "readwrite");
    tx.objectStore(STORE_CATEGORIES).put({ key, count, updatedAt: Date.now() });
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function idbGetCategoryCounts(): Promise<Record<string, number>> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_CATEGORIES, "readonly");
    const rows = (await reqToPromise(tx.objectStore(STORE_CATEGORIES).getAll())) as {
      key: string;
      count: number;
    }[];
    await txDone(tx);
    const out: Record<string, number> = {};
    for (const r of rows ?? []) out[r.key] = r.count;
    return out;
  } finally {
    db.close();
  }
}

/** Cache a thumbnail blob for offline use (best-effort, size-capped). */
export async function idbPutDownloadedAsset(url: string, blob: Blob): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_ASSETS, "readwrite");
    const store = tx.objectStore(STORE_ASSETS);
    const existing = (await reqToPromise(store.getAll())) as DownloadedAsset[];
    let total = existing.reduce((s, a) => s + (a.bytes || 0), 0);
    const entry: DownloadedAsset = {
      url,
      blob,
      cachedAt: Date.now(),
      bytes: blob.size,
    };
    if (total + blob.size > MAX_ASSET_BYTES) {
      const sorted = [...existing].sort((a, b) => a.cachedAt - b.cachedAt);
      for (const old of sorted) {
        if (total + blob.size <= MAX_ASSET_BYTES) break;
        store.delete(old.url);
        total -= old.bytes || 0;
      }
    }
    store.put(entry);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function idbGetDownloadedAsset(url: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_ASSETS, "readonly");
    const row = (await reqToPromise(tx.objectStore(STORE_ASSETS).get(url))) as
      | DownloadedAsset
      | undefined;
    await txDone(tx);
    return row?.blob ?? null;
  } finally {
    db.close();
  }
}

const SETTINGS_KEY = "lk-studio-auto-update-designs";

export function loadAutoUpdateSettings(): AutoUpdateDesignsSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { wifi: true, mobileData: false };
    const parsed = JSON.parse(raw) as Partial<AutoUpdateDesignsSettings>;
    return {
      wifi: parsed.wifi !== false,
      mobileData: parsed.mobileData === true,
    };
  } catch {
    return { wifi: true, mobileData: false };
  }
}

export function saveAutoUpdateSettings(settings: AutoUpdateDesignsSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
