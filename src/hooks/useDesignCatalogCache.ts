"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listItemToCachedDesign } from "@/lib/catalog-sync/filter";
import {
  loadCatalogCache,
  runCatalogSync,
  seedCatalogCacheFromServer,
  subscribeCatalogSync,
} from "@/lib/catalog-sync/sync-client";
import { isBrowserOnline } from "@/lib/catalog-sync/network";
import type { CachedDesign, SyncMetadata, SyncStatus } from "@/lib/catalog-sync/types";
import type { DesignListItem } from "@/lib/design-list-select";

/**
 * Cache-first catalog loader: show IndexedDB immediately, sync in background.
 */
export function useDesignCatalogCache(seedDesigns?: DesignListItem[]) {
  const [designs, setDesigns] = useState<CachedDesign[]>([]);
  const [meta, setMeta] = useState<SyncMetadata | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [newDesignCount, setNewDesignCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [cacheEmpty, setCacheEmpty] = useState(false);
  const seededRef = useRef(false);
  const seedRef = useRef(seedDesigns);
  seedRef.current = seedDesigns;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadCatalogCache();
        if (cancelled) return;
        setDesigns(loaded.designs);
        setMeta(loaded.meta);
        setCacheEmpty(loaded.designs.length === 0);

        const seed = seedRef.current;
        if (
          loaded.designs.length === 0 &&
          seed?.length &&
          !seededRef.current &&
          isBrowserOnline()
        ) {
          seededRef.current = true;
          const cached = seed.map(listItemToCachedDesign);
          await seedCatalogCacheFromServer(cached);
          if (!cancelled) {
            setDesigns(cached);
            setCacheEmpty(false);
          }
        }
      } catch {
        if (!cancelled) setCacheEmpty(true);
      } finally {
        if (!cancelled) setReady(true);
      }

      void runCatalogSync().then((result) => {
        if (cancelled) return;
        setDesigns(result.designs);
        setMeta(result.meta);
        setStatus(result.status);
        setNewDesignCount(result.newDesignCount);
        setCacheEmpty(result.designs.length === 0);
      });
    })();

    const unsub = subscribeCatalogSync((state) => {
      setDesigns(state.designs);
      setMeta(state.meta);
      setStatus(state.status);
      setNewDesignCount(state.newDesignCount);
      setCacheEmpty(state.designs.length === 0);
    });

    function onOnline() {
      void runCatalogSync({ force: true });
    }
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const refresh = useCallback(async () => {
    const result = await runCatalogSync({ force: true, ignoreNetworkPrefs: true });
    setDesigns(result.designs);
    setMeta(result.meta);
    setStatus(result.status);
    setNewDesignCount(result.newDesignCount);
    setCacheEmpty(result.designs.length === 0);
    return result;
  }, []);

  const dismissNewBadge = useCallback(() => setNewDesignCount(0), []);

  const offlineNoCache = ready && cacheEmpty && !isBrowserOnline();

  return {
    designs,
    meta,
    status,
    newDesignCount,
    ready,
    cacheEmpty,
    offlineNoCache,
    refresh,
    dismissNewBadge,
  };
}
