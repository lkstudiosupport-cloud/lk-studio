"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import { catalogBrowseApiQuery } from "@/lib/catalog-browse-query";
import { defaultCatalogPartForCategory } from "@/lib/design-catalog-part";
import { CATALOG_PARTS } from "@/lib/design-catalog-part";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { defaultSizeTierForCategory } from "@/lib/design-size-tier";
import { DESIGN_SIZE_TIERS } from "@/lib/design-size-tier";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import type { DesignListItem } from "@/lib/design-list-select";

type PageResult = {
  items: DesignListItem[];
  total: number | null;
  hasMore: boolean;
  error?: string;
};

function defaultBrowseQuery(category: ServiceCategory) {
  return {
    category,
    sizeTier: defaultSizeTierForCategory(category),
    catalogPart: defaultCatalogPartForCategory(category),
  };
}

/** Client-side category / tier / part switching — no full page reload (Capacitor-safe). */
export function useCatalogBrowseSwitch({
  initialCategory,
  catalogCategories,
  initialSizeTier,
  initialCatalogPart,
  initialDesigns,
  initialTotal,
  initialHasMore,
  initialApiQuery,
  initialBrowseCache,
  pageUrl,
}: {
  initialCategory: ServiceCategory;
  /** Categories to prefetch in the background (e.g. Maggam, Blouse, …). */
  catalogCategories: ServiceCategory[];
  initialSizeTier?: DesignSizeTier;
  initialCatalogPart?: CatalogPart;
  initialDesigns: DesignListItem[];
  initialTotal: number;
  initialHasMore: boolean;
  initialApiQuery: string;
  /** SSR-preloaded page-1 data for every tier/part tab — instant switching. */
  initialBrowseCache?: Record<string, PageResult>;
  pageUrl: (
    category: ServiceCategory,
    sizeTier?: DesignSizeTier,
    catalogPart?: CatalogPart
  ) => string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [sizeTier, setSizeTier] = useState(initialSizeTier);
  const [catalogPart, setCatalogPart] = useState(initialCatalogPart);
  const [designs, setDesigns] = useState(initialDesigns);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [apiQuery, setApiQuery] = useState(initialApiQuery);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");

  const cacheRef = useRef<Map<string, PageResult>>(new Map());
  const inflightRef = useRef<Map<string, Promise<PageResult>>>(new Map());

  const applyResult = useCallback(
    (
      data: PageResult,
      q: string,
      cat: ServiceCategory,
      tier?: DesignSizeTier,
      part?: CatalogPart
    ) => {
      setDesigns(data.items);
      if (data.total != null) setTotal(data.total);
      setHasMore(data.hasMore);
      setApiQuery(q);
      setCategory(cat);
      if (tier !== undefined) setSizeTier(tier);
      if (part !== undefined) setCatalogPart(part);
      cacheRef.current.set(q, data);
    },
    []
  );

  useEffect(() => {
    setCategory(initialCategory);
    setSizeTier(initialSizeTier);
    setCatalogPart(initialCatalogPart);
    setDesigns(initialDesigns);
    setTotal(initialTotal);
    setHasMore(initialHasMore);
    setApiQuery(initialApiQuery);
    setSwitchError("");
    setSwitching(false);

    if (initialBrowseCache) {
      for (const [key, value] of Object.entries(initialBrowseCache)) {
        cacheRef.current.set(key, value);
      }
    } else {
      cacheRef.current.set(initialApiQuery, {
        items: initialDesigns,
        total: initialTotal,
        hasMore: initialHasMore,
      });
    }
  }, [
    initialCategory,
    initialSizeTier,
    initialCatalogPart,
    initialDesigns,
    initialTotal,
    initialHasMore,
    initialApiQuery,
    initialBrowseCache,
  ]);

  const fetchQuery = useCallback(async (q: string): Promise<PageResult> => {
    const cached = cacheRef.current.get(q);
    if (cached) return cached;

    const inflight = inflightRef.current.get(q);
    if (inflight) return inflight;

    const promise = (async () => {
      const res = await fetch(`/api/catalog/designs?${q}&page=1`, { credentials: "same-origin" });
      const data = (await res.json()) as PageResult;
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      cacheRef.current.set(q, data);
      return data;
    })();

    inflightRef.current.set(q, promise);
    try {
      return await promise;
    } finally {
      inflightRef.current.delete(q);
    }
  }, []);

  const prefetchQuery = useCallback(
    (q: string) => {
      if (cacheRef.current.has(q) || inflightRef.current.has(q)) return;
      void fetchQuery(q).catch(() => {
        /* ignore background prefetch errors */
      });
    },
    [fetchQuery]
  );

  const prefetchCategorySubgroups = useCallback(
    (cat: ServiceCategory) => {
      if (categoryHasSizeTiers(cat)) {
        for (const tier of DESIGN_SIZE_TIERS) {
          prefetchQuery(catalogBrowseApiQuery({ category: cat, sizeTier: tier }));
        }
      } else if (categoryHasCatalogParts(cat)) {
        for (const part of CATALOG_PARTS) {
          prefetchQuery(catalogBrowseApiQuery({ category: cat, catalogPart: part }));
        }
      }
    },
    [prefetchQuery]
  );

  const prefetchCategory = useCallback(
    (cat: ServiceCategory) => {
      prefetchQuery(catalogBrowseApiQuery(defaultBrowseQuery(cat)));
      prefetchCategorySubgroups(cat);
    },
    [prefetchCategorySubgroups, prefetchQuery]
  );

  /** Warm other category tabs after first paint — staggered to avoid mobile burst. */
  useEffect(() => {
    let cancelled = false;
    const others = catalogCategories.filter((c) => c !== category);
    others.forEach((cat, index) => {
      window.setTimeout(() => {
        if (!cancelled) prefetchCategory(cat);
      }, 400 + index * 250);
    });
    return () => {
      cancelled = true;
    };
  }, [catalogCategories, category, prefetchCategory]);

  /** Warm tier/part tabs for the active category. */
  useEffect(() => {
    prefetchCategorySubgroups(category);
  }, [category, prefetchCategorySubgroups]);

  const fetchBrowse = useCallback(
    async (
      nextCategory?: ServiceCategory,
      nextTier?: DesignSizeTier,
      nextPart?: CatalogPart
    ) => {
      const cat = nextCategory ?? category;
      const tier =
        nextTier ??
        (nextCategory ? defaultSizeTierForCategory(nextCategory) : sizeTier);
      const part =
        nextPart ??
        (nextCategory ? defaultCatalogPartForCategory(nextCategory) : catalogPart);
      const q = catalogBrowseApiQuery({ category: cat, sizeTier: tier, catalogPart: part });

      const cached = cacheRef.current.get(q);
      if (cached) {
        applyResult(cached, q, cat, tier, part);
        window.history.replaceState(null, "", pageUrl(cat, tier, part));
        return;
      }

      setSwitching(true);
      setSwitchError("");
      try {
        const data = await fetchQuery(q);
        applyResult(data, q, cat, tier, part);
        window.history.replaceState(null, "", pageUrl(cat, tier, part));
      } catch (e) {
        setSwitchError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setSwitching(false);
      }
    },
    [applyResult, catalogPart, category, fetchQuery, pageUrl, sizeTier]
  );

  const pickCategory = useCallback(
    (next: ServiceCategory) => {
      if (next === category) return;
      const tier = defaultSizeTierForCategory(next);
      const part = defaultCatalogPartForCategory(next);
      setCategory(next);
      setSizeTier(tier);
      setCatalogPart(part);
      void fetchBrowse(next, tier, part);
    },
    [category, fetchBrowse]
  );

  const pickSizeTier = useCallback(
    (tier: DesignSizeTier) => {
      if (tier === sizeTier) return;
      setSizeTier(tier);
      void fetchBrowse(category, tier, catalogPart);
    },
    [fetchBrowse, sizeTier, catalogPart, category]
  );

  const pickCatalogPart = useCallback(
    (part: CatalogPart) => {
      if (part === catalogPart) return;
      setCatalogPart(part);
      void fetchBrowse(category, sizeTier, part);
    },
    [fetchBrowse, sizeTier, catalogPart, category]
  );

  const prefetchSizeTier = useCallback(
    (tier: DesignSizeTier) => {
      prefetchQuery(catalogBrowseApiQuery({ category, sizeTier: tier, catalogPart }));
    },
    [catalogPart, category, prefetchQuery]
  );

  const prefetchCatalogPart = useCallback(
    (part: CatalogPart) => {
      prefetchQuery(catalogBrowseApiQuery({ category, sizeTier, catalogPart: part }));
    },
    [category, sizeTier, prefetchQuery]
  );

  return {
    category,
    sizeTier,
    catalogPart,
    designs,
    total,
    hasMore,
    apiQuery,
    switching,
    switchError,
    pickCategory,
    pickSizeTier,
    pickCatalogPart,
    prefetchCategory,
    prefetchSizeTier,
    prefetchCatalogPart,
  };
}
