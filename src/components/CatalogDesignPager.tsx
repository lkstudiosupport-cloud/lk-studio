"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { DesignListItem } from "@/lib/design-list-select";
import { Loader2 } from "lucide-react";

type PageResult = {
  items: DesignListItem[];
  total: number;
  page: number;
  hasMore: boolean;
};

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

  useEffect(() => {
    setDesigns(initialDesigns);
    setTotal(initialTotal);
    setPage(1);
    setHasMore(initialHasMore);
    setError("");
  }, [initialDesigns, initialTotal, initialHasMore, apiQuery]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError("");
    try {
      const nextPage = page + 1;
      const url = `/api/catalog/designs?${apiQuery}&page=${nextPage}`;
      const res = await fetch(url);
      const data = (await res.json()) as PageResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setDesigns((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [apiQuery, hasMore, loading, page]);

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
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="btn-secondary inline-flex min-w-[10rem] items-center justify-center gap-2 px-6 py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(locale, "loadingDesigns")}
              </>
            ) : (
              t(locale, "loadMoreDesigns")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
