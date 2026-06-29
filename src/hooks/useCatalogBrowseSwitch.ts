"use client";

import { useCallback, useEffect, useState } from "react";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import { catalogBrowseApiQuery } from "@/lib/catalog-browse-query";
import type { DesignListItem } from "@/lib/design-list-select";

type PageResult = {
  items: DesignListItem[];
  total: number;
  hasMore: boolean;
  error?: string;
};

/** Client-side tier/part switching — avoids router.push query-only nav (broken in Capacitor WebView). */
export function useCatalogBrowseSwitch({
  category,
  initialSizeTier,
  initialCatalogPart,
  initialDesigns,
  initialTotal,
  initialHasMore,
  initialApiQuery,
  pageUrl,
}: {
  category: ServiceCategory;
  initialSizeTier?: DesignSizeTier;
  initialCatalogPart?: CatalogPart;
  initialDesigns: DesignListItem[];
  initialTotal: number;
  initialHasMore: boolean;
  initialApiQuery: string;
  pageUrl: (sizeTier?: DesignSizeTier, catalogPart?: CatalogPart) => string;
}) {
  const [sizeTier, setSizeTier] = useState(initialSizeTier);
  const [catalogPart, setCatalogPart] = useState(initialCatalogPart);
  const [designs, setDesigns] = useState(initialDesigns);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [apiQuery, setApiQuery] = useState(initialApiQuery);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");

  useEffect(() => {
    setSizeTier(initialSizeTier);
    setCatalogPart(initialCatalogPart);
    setDesigns(initialDesigns);
    setTotal(initialTotal);
    setHasMore(initialHasMore);
    setApiQuery(initialApiQuery);
    setSwitchError("");
  }, [
    category,
    initialSizeTier,
    initialCatalogPart,
    initialDesigns,
    initialTotal,
    initialHasMore,
    initialApiQuery,
  ]);

  const fetchBrowse = useCallback(
    async (nextTier?: DesignSizeTier, nextPart?: CatalogPart) => {
      const tier = nextTier ?? sizeTier;
      const part = nextPart ?? catalogPart;
      setSwitching(true);
      setSwitchError("");
      try {
        const q = catalogBrowseApiQuery({ category, sizeTier: tier, catalogPart: part });
        const res = await fetch(`/api/catalog/designs?${q}&page=1`);
        const data = (await res.json()) as PageResult;
        if (!res.ok) throw new Error(data.error ?? "Load failed");
        setDesigns(data.items);
        setTotal(data.total);
        setHasMore(data.hasMore);
        setApiQuery(q);
        setSizeTier(tier);
        setCatalogPart(part);
        window.history.replaceState(null, "", pageUrl(tier, part));
      } catch (e) {
        setSwitchError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setSwitching(false);
      }
    },
    [category, sizeTier, catalogPart, pageUrl]
  );

  const pickSizeTier = useCallback(
    (tier: DesignSizeTier) => {
      if (tier === sizeTier) return;
      void fetchBrowse(tier, catalogPart);
    },
    [fetchBrowse, sizeTier, catalogPart]
  );

  const pickCatalogPart = useCallback(
    (part: CatalogPart) => {
      if (part === catalogPart) return;
      void fetchBrowse(sizeTier, part);
    },
    [fetchBrowse, sizeTier, catalogPart]
  );

  return {
    sizeTier,
    catalogPart,
    designs,
    total,
    hasMore,
    apiQuery,
    switching,
    switchError,
    pickSizeTier,
    pickCatalogPart,
  };
}
