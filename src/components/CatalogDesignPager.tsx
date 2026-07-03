"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { DesignListItem } from "@/lib/design-list-select";
import { Loader2 } from "lucide-react";

type PageResult = {
  items: DesignListItem[];
  total: number | null;
  page: number;
  hasMore: boolean;
};

function DesignGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-zinc-200" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogDesignPager({
  locale,
  initialDesigns,
  total: initialTotal,
  hasMore: initialHasMore,
  apiQuery,
  children,
}: {
  locale: Locale;
  initialDesigns: DesignListItem[];
  total: number;
  hasMore: boolean;
  /** Query string after ? (e.g. category=MAGGAM&size=SMALL&mode=browse) */
  apiQuery: string;
  children: (designs: DesignListItem[]) => React.ReactNode;
}) {
  const [designs, setDesigns] = useState(initialDesigns);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageRef = useRef(page);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const prefetchRef = useRef<Map<number, PageResult>>(new Map());
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    setDesigns(initialDesigns);
    setTotal(initialTotal);
    setPage(1);
    pageRef.current = 1;
    setHasMore(initialHasMore);
    hasMoreRef.current = initialHasMore;
    setError("");
    prefetchRef.current.clear();
  }, [initialDesigns, initialTotal, initialHasMore, apiQuery]);

  const fetchPage = useCallback(
    async (nextPage: number, { apply = true }: { apply?: boolean } = {}) => {
      const cached = prefetchRef.current.get(nextPage);
      if (cached) {
        prefetchRef.current.delete(nextPage);
        if (apply) {
          setDesigns((prev) => [...prev, ...cached.items]);
          if (cached.total != null) setTotal(cached.total);
          setPage(cached.page);
          pageRef.current = cached.page;
          setHasMore(cached.hasMore);
          hasMoreRef.current = cached.hasMore;
        }
        return cached;
      }

      const url = `/api/catalog/designs?${apiQuery}&page=${nextPage}`;
      const res = await fetch(url, { credentials: "same-origin" });
      const data = (await res.json()) as PageResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Load failed");

      if (apply) {
        setDesigns((prev) => [...prev, ...data.items]);
        if (data.total != null) setTotal(data.total);
        setPage(data.page);
        pageRef.current = data.page;
        setHasMore(data.hasMore);
        hasMoreRef.current = data.hasMore;
      }

      return data;
    },
    [apiQuery]
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const nextPage = pageRef.current + 1;
      await fetchPage(nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchPage]);

  const prefetchNext = useCallback(async () => {
    if (!hasMoreRef.current || loadingRef.current) return;
    const nextPage = pageRef.current + 1;
    if (prefetchRef.current.has(nextPage)) return;
    try {
      const data = await fetchPage(nextPage, { apply: false });
      prefetchRef.current.set(nextPage, data);
    } catch {
      /* ignore prefetch errors */
    }
  }, [fetchPage]);

  /** Auto-load when user scrolls near the bottom — no extra tap needed. */
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "480px 0px 240px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, apiQuery]);

  /** Prefetch the next page shortly after the current page is shown. */
  useEffect(() => {
    if (!hasMore || page < 1) return;
    const timer = window.setTimeout(() => {
      void prefetchNext();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [hasMore, page, apiQuery, prefetchNext]);

  return (
    <div className="space-y-4">
      {children(designs)}

      {designs.length > 0 && (
        <p className="text-center text-xs text-zinc-500">
          {t(locale, "showingDesignsCount", { shown: designs.length, total })}
        </p>
      )}

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {hasMore && (
        <div ref={sentinelRef} className="space-y-3 pb-2">
          {loading ? (
            <>
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
                <Loader2 className="h-4 w-4 animate-spin text-brand-green" />
                {t(locale, "loadingDesigns")}
              </div>
              <DesignGridSkeleton />
            </>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                className="btn-secondary inline-flex min-w-[10rem] items-center justify-center gap-2 px-6 py-2.5 text-sm"
              >
                {t(locale, "loadMoreDesigns")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
