"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { countSortedCatalogDesignsByCategory, isSortedCatalogDesign } from "@/lib/catalog-design-sort";
import type { DesignListItem } from "@/lib/design-queries";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { SizeTierButtons } from "@/components/SizeTierButtons";
import { CatalogPartButtons } from "@/components/CatalogPartButtons";
import { withQueryParam } from "@/lib/query-string";

export function CustomerCatalogPanel({
  locale,
  designs,
  favoriteDesignIds,
  priceShopId,
  initialCategory,
  initialSizeTier,
  initialCatalogPart,
}: {
  locale: Locale;
  designs: DesignListItem[];
  favoriteDesignIds: string[];
  priceShopId?: string;
  initialCategory?: ServiceCategory;
  initialSizeTier?: DesignSizeTier;
  initialCatalogPart?: CatalogPart;
}) {
  const tabs = CATEGORIES.filter((c) => CATALOG_CATEGORIES.includes(c.key));
  const [category, setCategory] = useState<ServiceCategory | undefined>(initialCategory);
  const [sizeTier, setSizeTier] = useState<DesignSizeTier | undefined>(initialSizeTier);
  const [catalogPart, setCatalogPart] = useState<CatalogPart | undefined>(initialCatalogPart);

  const favorites = useMemo(() => new Set(favoriteDesignIds), [favoriteDesignIds]);
  const hasSizeTiers = category ? categoryHasSizeTiers(category) : false;
  const hasCatalogParts = category ? categoryHasCatalogParts(category) : false;
  const needsSubgroup = hasSizeTiers || hasCatalogParts;

  const tierCounts = useMemo(() => {
    if (!category || !hasSizeTiers) return null;
    const counts = { SMALL: 0, MEDIUM: 0, BIG: 0 } as Record<DesignSizeTier, number>;
    for (const d of designs) {
      if (d.category !== category || !d.sizeTier) continue;
      counts[d.sizeTier]++;
    }
    return counts;
  }, [designs, category, hasSizeTiers]);

  const partCounts = useMemo(() => {
    if (!category || !hasCatalogParts) return null;
    const counts = { MAIN: 0, HAND_SLEEVES: 0 } as Record<CatalogPart, number>;
    for (const d of designs) {
      if (d.category !== category || !d.catalogPart) continue;
      counts[d.catalogPart]++;
    }
    return counts;
  }, [designs, category, hasCatalogParts]);

  const categoryDesigns = useMemo(() => {
    if (!category) return [];
    let list = designs.filter((d) => d.category === category && isSortedCatalogDesign(d, category));
    if (hasSizeTiers) {
      if (!sizeTier) return [];
      list = list.filter((d) => d.sizeTier === sizeTier);
    }
    if (hasCatalogParts) {
      if (!catalogPart) return [];
      list = list.filter((d) => d.catalogPart === catalogPart);
    }
    return list;
  }, [designs, category, hasSizeTiers, hasCatalogParts, sizeTier, catalogPart]);

  const counts = useMemo(
    () => countSortedCatalogDesignsByCategory(designs, tabs.map((c) => c.key)),
    [designs, tabs]
  );

  function pickCategory(next: ServiceCategory) {
    setCategory(next);
    setSizeTier(undefined);
    setCatalogPart(undefined);
    window.history.replaceState(null, "", withQueryParam("/customer/designs", "category", next));
  }

  function pickSizeTier(next: DesignSizeTier) {
    setSizeTier(next);
    if (!category) return;
    window.history.replaceState(
      null,
      "",
      withQueryParam(withQueryParam("/customer/designs", "category", category), "size", next)
    );
  }

  function pickCatalogPart(next: CatalogPart) {
    setCatalogPart(next);
    if (!category) return;
    window.history.replaceState(
      null,
      "",
      withQueryParam(withQueryParam("/customer/designs", "category", category), "part", next)
    );
  }

  const subgroupReady = !needsSubgroup || (hasSizeTiers && sizeTier) || (hasCatalogParts && catalogPart);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "designs")}</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tabs.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pickCategory(c.key)}
            className={`min-h-[4rem] rounded-2xl p-2.5 text-center text-xs font-semibold shadow-md transition active:scale-[0.98] hover:opacity-90 sm:min-h-[4.5rem] sm:p-3 sm:text-sm ${
              c.color
            } ${category === c.key ? "category-tab-active" : ""}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
            <span className="mt-1 block text-xs opacity-90">{counts[c.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {!category && (
        <p className="card-premium p-6 text-center text-sm text-zinc-600">
          {t(locale, "customerPickCategoryHint")}
        </p>
      )}

      {category && !priceShopId && (
        <p className="card-premium p-4 text-sm text-zinc-600">
          {t(locale, "pickShopForFavorites")}{" "}
          <Link href="/customer/shops" className="font-semibold text-brand-green underline">
            {t(locale, "browseShops")}
          </Link>
        </p>
      )}

      {category && hasSizeTiers && (
        <div className="space-y-2">
          <SizeTierButtons
            locale={locale}
            active={sizeTier}
            onPick={pickSizeTier}
            counts={tierCounts ?? undefined}
          />
          {!sizeTier && (
            <p className="card-premium p-4 text-center text-sm text-zinc-600">
              {t(locale, "customerPickSizeTierHint")}
            </p>
          )}
        </div>
      )}

      {category && hasCatalogParts && (
        <div className="space-y-2">
          <CatalogPartButtons
            locale={locale}
            category={category}
            active={catalogPart}
            onPick={pickCatalogPart}
            counts={partCounts ?? undefined}
          />
          {!catalogPart && (
            <p className="card-premium p-4 text-center text-sm text-zinc-600">
              {t(locale, "customerPickCatalogPartHint")}
            </p>
          )}
        </div>
      )}

      {category && subgroupReady && (
        <ShopDesignCollections
          locale={locale}
          designs={categoryDesigns}
          shopId={priceShopId}
          favoriteDesignIds={favorites}
          detailHrefForDesign={(d) =>
            withQueryParam(`/customer/designs/${d.id}`, "category", d.category)
          }
        />
      )}
    </div>
  );
}
