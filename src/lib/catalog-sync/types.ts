import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";

/** Design row stored in IndexedDB (JSON-safe). */
export type CachedDesign = {
  id: string;
  shopId: string | null;
  isCatalog: boolean;
  catalogNumber: string | null;
  title: string;
  imagePath: string;
  imagesJson: string | null;
  category: ServiceCategory;
  createdAt: string;
  updatedAt?: string;
  sizeTier: DesignSizeTier | null;
  catalogPart: CatalogPart | null;
};

export type SyncMetadata = {
  id: "global";
  lastSyncedVersion: number;
  lastSyncedAt: number | null;
  fullSyncComplete: boolean;
};

export type DownloadedAsset = {
  url: string;
  blob: Blob;
  cachedAt: number;
  bytes: number;
};

export type CatalogSyncDelta = {
  currentVersion: number;
  hasChanges: boolean;
  fullSync: boolean;
  added: CachedDesign[];
  updated: CachedDesign[];
  deleted: string[];
  page: number;
  hasMore: boolean;
};

export type SyncStatus = "idle" | "updating" | "updated" | "offline" | "error";

export type AutoUpdateDesignsSettings = {
  /** Download catalog updates on Wi‑Fi (default true). */
  wifi: boolean;
  /** Download catalog updates on mobile data (default false). */
  mobileData: boolean;
};
