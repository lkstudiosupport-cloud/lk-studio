"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import { catalogBrowseApiQuery } from "@/lib/catalog-browse-query";
import { defaultCatalogPartForCategory } from "@/lib/design-catalog-part";
import { CATALOG_PARTS } from "@/lib/design-catalog-part";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { defaultSizeTierForCategory } from "@/lib/design-size-tier";
import { DESIGN_SIZE_TIERS } from "@/lib/design-size-tier";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import type { DesignListItem } from "@/lib/design-list-select";
import {
  filterCachedCatalogDesigns,
  pageCachedDesigns,
} from "@/lib/catalog-sync/filter";
import type { CachedDesign } from "@/lib/catalog-sync/types";
import { isShopOwnedUploadCategory } from "@/lib/design-access";
import { CATALOG_PAGE_SIZE } from "@/lib/limits";

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

function pageFromCache(
  all: CachedDesign[],
  category: ServiceCategory,
  sizeTier?: DesignSizeTier,
  catalogPart?: CatalogPart
): PageResult | null {
  if (isShopOwnedUploadCategory(category)) return null;
  if (!all.length) return null;
  const filtered = filterCachedCatalogDesigns(all, { category, sizeTier, catalogPart });
  const page = pageCachedDesigns(filtered, 1, CATALOG_PAGE_SIZE);
  return {
    items: page.items,
    total: page.total,
    hasMore: page.hasMore,
  };
}

/** Client-side category / tier / part switching — cache-first when IndexedDB catalog is warm. */
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
  cachedCatalogDesigns,
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
  /** Full catalog from IndexedDB — enables cache-first category switches. */
  cachedCatalogDesigns?: CachedDesign[];
}) {
  const cacheFirstPage = useMemo(
    () =>
      pageFromCache(
        cachedCatalogDesigns ?? [],
        initialCategory,
        initialSizeTier,
        initialCatalogPart
      ),
    [cachedCatalogDesigns, initialCategory, initialSizeTier, initialCatalogPart]
  );

  const bootDesigns = cacheFirstPage?.items?.length ? cacheFirstPage.items : initialDesigns;
  const bootTotal = cacheFirstPage?.total ?? initialTotal;
  const bootHasMore = cacheFirstPage?.hasMore ?? initialHasMore;

  const [category, setCategory] = useState(initialCategory);
  const [sizeTier, setSizeTier] = useState(initialSizeTier);
  const [catalogPart, setCatalogPart] = useState(initialCatalogPart);
  const [designs, setDesigns] = useState(bootDesigns);
  const [total, setTotal] = useState(bootTotal);
  const [hasMore, setHasMore] = useState(bootHasMore);
  const [apiQuery, setApiQuery] = useState(initialApiQuery);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  /** When true, CatalogDesignPager pages from IndexedDB instead of the network. */
  const [useLocalPager, setUseLocalPager] = useState(
    () => Boolean(cacheFirstPage?.items?.length && (cachedCatalogDesigns?.length ?? 0) > 0)
  );

  const cacheRef = useRef<Map<string, PageResult>>(new Map());
  const inflightRef = useRef<Map<string, Promise<PageResult>>>(new Map());
  const cachedAllRef = useRef(cachedCatalogDesigns ?? []);

  useEffect(() => {
    cachedAllRef.current = cachedCatalogDesigns ?? [];
  }, [cachedCatalogDesigns]);

  const applyResult = useCallback(
    (
      data: PageResult,
      q: string,
      cat: ServiceCategory,
      tier?: DesignSizeTier,
      part?: CatalogPart,
      local = false
    ) => {
      setDesigns(data.items);
      if (data.total != null) setTotal(data.total);
      setHasMore(data.hasMore);
      setApiQuery(q);
      setCategory(cat);
      if (tier !== undefined) setSizeTier(tier);
      if (part !== undefined) setCatalogPart(part);
      setUseLocalPager(local);
      cacheRef.current.set(q, data);
    },
    []
  );

  useEffect(() => {
    setCategory(initialCategory);
    setSizeTier(initialSizeTier);
    setCatalogPart(initialCatalogPart);
    setSwitchError("");
    setSwitching(false);

    const fromCache = pageFromCache(
      cachedCatalogDesigns ?? [],
      initialCategory,
      initialSizeTier,
      initialCatalogPart
    );
    if (fromCache?.items.length) {
      setDesigns(fromCache.items);
      setTotal(fromCache.total ?? fromCache.items.length);
      setHasMore(fromCache.hasMore);
      setUseLocalPager(true);
    } else {
      setDesigns(initialDesigns);
      setTotal(initialTotal);
      setHasMore(initialHasMore);
      setUseLocalPager(false);
    }
    setApiQuery(initialApiQuery);

    if (initialBrowseCache) {
      for (const [key, value] of Object.entries(initialBrowseCache)) {
        cacheRef.current.set(key, value);
      }
    } else {
      cacheRef.current.set(initialApiQuery, {
        items: fromCache?.items.length ? fromCache.items : initialDesigns,
        total: fromCache?.total ?? initialTotal,
        hasMore: fromCache?.hasMore ?? initialHasMore,
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
    cachedCatalogDesigns,
  ]);

  /** When IDB catalog updates after background sync, refresh the active filter. */
  useEffect(() => {
    if (!cachedCatalogDesigns?.length) return;
    if (isShopOwnedUploadCategory(category)) return;
    const fromCache = pageFromCache(cachedCatalogDesigns, category, sizeTier, catalogPart);
    if (!fromCache) return;
    setDesigns(fromCache.items);
    if (fromCache.total != null) setTotal(fromCache.total);
    setHasMore(fromCache.hasMore);
    setUseLocalPager(true);
    cacheRef.current.set(apiQuery, fromCache);
  }, [cachedCatalogDesigns]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: only on cache identity change

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
      // Prefer IndexedDB filter for catalog categories
      const params = new URLSearchParams(q);
      const cat = params.get("category") as ServiceCategory | null;
      if (cat && !isShopOwnedUploadCategory(cat) && cachedAllRef.current.length) {
        const tier = (params.get("size") as DesignSizeTier | null) || undefined;
        const part = (params.get("part") as CatalogPart | null) || undefined;
        const local = pageFromCache(cachedAllRef.current, cat, tier, part);
        if (local) {
          cacheRef.current.set(q, local);
          return;
        }
      }
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

      const local = pageFromCache(cachedAllRef.current, cat, tier, part);
      if (local?.items.length || (local && cachedAllRef.current.length > 0 && !isShopOwnedUploadCategory(cat))) {
        applyResult(local, q, cat, tier, part, true);
        window.history.replaceState(null, "", pageUrl(cat, tier, part));
        return;
      }

      const cached = cacheRef.current.get(q);
      if (cached) {
        applyResult(cached, q, cat, tier, part, false);
        window.history.replaceState(null, "", pageUrl(cat, tier, part));
        return;
      }

      setSwitching(true);
      setSwitchError("");
      try {
        const data = await fetchQuery(q);
        applyResult(data, q, cat, tier, part, false);
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

  const loadLocalPage = useCallback(
    (page: number): PageResult | null => {
      if (!useLocalPager || isShopOwnedUploadCategory(category)) return null;
      const filtered = filterCachedCatalogDesigns(cachedAllRef.current, {
        category,
        sizeTier,
        catalogPart,
      });
      const paged = pageCachedDesigns(filtered, page, CATALOG_PAGE_SIZE);
      return {
        items: paged.items,
        total: paged.total,
        hasMore: paged.hasMore,
      };
    },
    [useLocalPager, category, sizeTier, catalogPart]
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
    useLocalPager,
    loadLocalPage,
    pickCategory,
    pickSizeTier,
    pickCatalogPart,
    prefetchCategory,
    prefetchSizeTier,
    prefetchCatalogPart,
  };
}
