"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopTabId, ShopTabPayloadMap } from "@/lib/shop-tab-types";
import {
  clearShopTabCache,
  fetchShopTabData,
  getShopTabCache,
} from "@/lib/shop-tab-client-cache";

export function useShopTabData<T extends ShopTabId>(tab: T, query = "") {
  const [data, setData] = useState<ShopTabPayloadMap[T] | null>(() =>
    getShopTabCache<ShopTabPayloadMap[T]>(tab, query)
  );
  const [loading, setLoading] = useState(() => !getShopTabCache(tab, query));
  const [error, setError] = useState(false);

  const load = useCallback(
    async (force = false) => {
      const cached = force ? null : getShopTabCache<ShopTabPayloadMap[T]>(tab, query);
      if (cached) {
        setData(cached);
        setLoading(false);
        setError(false);
        // Soft refresh in background
        void fetchShopTabData(tab, query, { force: true })
          .then((fresh) => setData(fresh))
          .catch(() => {});
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const fresh = await fetchShopTabData(tab, query, { force });
        setData(fresh);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [tab, query]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(() => {
    clearShopTabCache(tab);
    return load(true);
  }, [load, tab]);

  return { data, loading, error, refresh, setData };
}
