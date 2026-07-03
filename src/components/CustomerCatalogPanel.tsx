"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { categoryHasCatalogParts, defaultCatalogPartForCategory } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers, defaultSizeTierForCategory } from "@/lib/design-size-tier";
import type { CatalogPartCounts, CatalogSizeTierCounts } from "@/lib/catalog-design-counts";
import type { DesignListItem } from "@/lib/design-queries";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { CatalogDesignPager } from "@/components/CatalogDesignPager";
import { CatalogCategoryTabs } from "@/components/CatalogCategoryTabs";
import { SizeTierButtons } from "@/components/SizeTierButtons";
import { CatalogPartButtons } from "@/components/CatalogPartButtons";
import { withQueryParam } from "@/lib/query-string";
import { useCatalogBrowseSwitch } from "@/hooks/useCatalogBrowseSwitch";
import { Loader2 } from "lucide-react";

function catalogUrl(
  category: ServiceCategory,
  sizeTier?: DesignSizeTier,
  catalogPart?: CatalogPart
): string {
  let url = withQueryParam("/customer/designs", "category", category);
  if (sizeTier) url = withQueryParam(url, "size", sizeTier);
  if (catalogPart) url = withQueryParam(url, "part", catalogPart);
  return url;
}

export function CustomerCatalogPanel({
  locale,
  designs,
  total,
  hasMore,
  apiQuery,
  categoryCounts,
  allTierCounts,
  allPartCounts,
  favoriteDesignIds,
  priceShopId,
  initialCategory,
  initialSizeTier,
  initialCatalogPart,
  initialBrowseCache,
}: {
  locale: Locale;
  designs: DesignListItem[];
  total: number;
  hasMore: boolean;
  apiQuery: string;
  categoryCounts: Partial<Record<ServiceCategory, number>>;
  allTierCounts: Partial<Record<ServiceCategory, CatalogSizeTierCounts>>;
  allPartCounts: Partial<Record<ServiceCategory, CatalogPartCounts>>;
  favoriteDesignIds: string[];
  priceShopId?: string;
  initialCategory: ServiceCategory;
  initialSizeTier?: DesignSizeTier;
  initialCatalogPart?: CatalogPart;
  initialBrowseCache?: Record<string, { items: DesignListItem[]; total: number | null; hasMore: boolean }>;
}) {
  const tabs = CATEGORIES.filter((c) => CATALOG_CATEGORIES.includes(c.key));
  const pageUrl = useCallback(
    (cat: ServiceCategory, sizeTier?: DesignSizeTier, catalogPart?: CatalogPart) =>
      catalogUrl(cat, sizeTier, catalogPart),
    []
  );
  const browse = useCatalogBrowseSwitch({
    initialCategory,
    catalogCategories: CATALOG_CATEGORIES,
    initialSizeTier: initialSizeTier ?? defaultSizeTierForCategory(initialCategory),
    initialCatalogPart: initialCatalogPart ?? defaultCatalogPartForCategory(initialCategory),
    initialDesigns: designs,
    initialTotal: total,
    initialHasMore: hasMore,
    initialApiQuery: apiQuery,
    initialBrowseCache,
    pageUrl,
  });
  const { category, sizeTier, catalogPart, pickSizeTier, pickCatalogPart } = browse;
  const tierCounts = allTierCounts[category] ?? null;
  const partCounts = allPartCounts[category] ?? null;
  const favorites = useMemo(() => new Set(favoriteDesignIds), [favoriteDesignIds]);
  const hasSizeTiers = categoryHasSizeTiers(category);
  const hasCatalogParts = categoryHasCatalogParts(category);
  const needsSubgroup = hasSizeTiers || hasCatalogParts;

  const subgroupReady =
    !needsSubgroup || (hasSizeTiers && sizeTier) || (hasCatalogParts && catalogPart);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "designs")}</h1>
      </div>

      <CatalogCategoryTabs
        locale={locale}
        tabs={tabs}
        active={category}
        counts={categoryCounts}
        onPick={browse.pickCategory}
        onPrefetch={browse.prefetchCategory}
      />

      {category && !priceShopId && (
        <p className="card-premium p-4 text-sm text-zinc-600">
          {t(locale, "pickShopForFavorites")}{" "}
          <Link href="/customer/shops" className="font-semibold text-brand-green underline">
            {t(locale, "browseShops")}
          </Link>
        </p>
      )}

      {category && hasSizeTiers && (
        <SizeTierButtons
          locale={locale}
          active={sizeTier}
          onPick={pickSizeTier}
          onPrefetch={browse.prefetchSizeTier}
          counts={
            tierCounts
              ? { SMALL: tierCounts.SMALL, MEDIUM: tierCounts.MEDIUM, BIG: tierCounts.BIG }
              : undefined
          }
        />
      )}

      {category && hasCatalogParts && (
        <CatalogPartButtons
          locale={locale}
          category={category}
          active={catalogPart}
          onPick={pickCatalogPart}
          onPrefetch={browse.prefetchCatalogPart}
          counts={
            partCounts
              ? { MAIN: partCounts.MAIN, HAND_SLEEVES: partCounts.HAND_SLEEVES }
              : undefined
          }
        />
      )}

      {category && subgroupReady && (
        <div className="relative space-y-4">
          {browse.switching && (
            <div className="flex items-center justify-center gap-2 py-1 text-sm text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin text-brand-green" />
              {t(locale, "loadingDesigns")}
            </div>
          )}
          {browse.switchError && (
            <p className="text-center text-sm text-red-600">{browse.switchError}</p>
          )}
          <div className={browse.switching ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <CatalogDesignPager
              locale={locale}
              initialDesigns={browse.designs}
              total={browse.total}
              hasMore={browse.hasMore}
              apiQuery={browse.apiQuery}
            >
              {(pagedDesigns) => (
                <ShopDesignCollections
                  locale={locale}
                  designs={pagedDesigns}
                  shopId={priceShopId}
                  favoriteDesignIds={favorites}
                  detailHrefForDesign={(d) =>
                    withQueryParam(`/customer/designs/${d.id}`, "category", d.category)
                  }
                />
              )}
            </CatalogDesignPager>
          </div>
        </div>
      )}
    </div>
  );
}
