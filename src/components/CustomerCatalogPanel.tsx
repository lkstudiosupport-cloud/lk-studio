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
  tierCounts,
  partCounts,
  favoriteDesignIds,
  priceShopId,
  initialCategory,
  initialSizeTier,
  initialCatalogPart,
}: {
  locale: Locale;
  designs: DesignListItem[];
  total: number;
  hasMore: boolean;
  apiQuery: string;
  categoryCounts: Partial<Record<ServiceCategory, number>>;
  tierCounts: CatalogSizeTierCounts | null;
  partCounts: CatalogPartCounts | null;
  favoriteDesignIds: string[];
  priceShopId?: string;
  initialCategory: ServiceCategory;
  initialSizeTier?: DesignSizeTier;
  initialCatalogPart?: CatalogPart;
}) {
  const tabs = CATEGORIES.filter((c) => CATALOG_CATEGORIES.includes(c.key));
  const category = initialCategory;
  const pageUrl = useCallback(
    (sizeTier?: DesignSizeTier, catalogPart?: CatalogPart) =>
      catalogUrl(category, sizeTier, catalogPart),
    [category]
  );
  const browse = useCatalogBrowseSwitch({
    category,
    initialSizeTier: initialSizeTier ?? defaultSizeTierForCategory(category),
    initialCatalogPart: initialCatalogPart ?? defaultCatalogPartForCategory(category),
    initialDesigns: designs,
    initialTotal: total,
    initialHasMore: hasMore,
    initialApiQuery: apiQuery,
    pageUrl,
  });
  const { sizeTier, catalogPart, pickSizeTier, pickCatalogPart } = browse;
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tabs.map((c) => (
          <Link
            key={c.key}
            href={catalogUrl(c.key, defaultSizeTierForCategory(c.key), defaultCatalogPartForCategory(c.key))}
            scroll={false}
            prefetch
            className={`min-h-[4rem] rounded-2xl p-2.5 text-center text-xs font-semibold shadow-md transition hover:opacity-100 sm:min-h-[4.5rem] sm:p-3 sm:text-sm ${
              c.color
            } ${category === c.key ? "category-tab-active" : "opacity-90"}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
            <span className="mt-1 block text-xs opacity-90">({categoryCounts[c.key] ?? 0})</span>
          </Link>
        ))}
      </div>

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
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70">
              <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
            </div>
          )}
          {browse.switchError && (
            <p className="text-center text-sm text-red-600">{browse.switchError}</p>
          )}
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
      )}
    </div>
  );
}
