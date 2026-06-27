"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { categoryHasCatalogParts, defaultCatalogPartForCategory } from "@/lib/design-catalog-part";
import {
  categoryHasSizeTiers,
  defaultSizeTierForCategory,
} from "@/lib/design-size-tier";
import { countSortedCatalogDesignsByCategory, isSortedCatalogDesign } from "@/lib/catalog-design-sort";
import type { DesignListItem } from "@/lib/design-queries";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { SizeTierButtons } from "@/components/SizeTierButtons";
import { CatalogPartButtons } from "@/components/CatalogPartButtons";
import { withQueryParam } from "@/lib/query-string";

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
  initialCategory: ServiceCategory;
  initialSizeTier?: DesignSizeTier;
  initialCatalogPart?: CatalogPart;
}) {
  const tabs = CATEGORIES.filter((c) => CATALOG_CATEGORIES.includes(c.key));
  const [category, setCategory] = useState<ServiceCategory>(initialCategory);
  const [sizeTier, setSizeTier] = useState<DesignSizeTier | undefined>(
    initialSizeTier ?? defaultSizeTierForCategory(initialCategory)
  );
  const [catalogPart, setCatalogPart] = useState<CatalogPart | undefined>(
    initialCatalogPart ?? defaultCatalogPartForCategory(initialCategory)
  );

  const favorites = useMemo(() => new Set(favoriteDesignIds), [favoriteDesignIds]);
  const hasSizeTiers = categoryHasSizeTiers(category);
  const hasCatalogParts = categoryHasCatalogParts(category);
  const needsSubgroup = hasSizeTiers || hasCatalogParts;

  const counts = useMemo(
    () => countSortedCatalogDesignsByCategory(designs, tabs.map((c) => c.key)),
    [designs, tabs]
  );

  const tierCounts = useMemo(() => {
    if (!hasSizeTiers) return null;
    const map = { SMALL: 0, MEDIUM: 0, BIG: 0 } as Record<DesignSizeTier, number>;
    for (const d of designs) {
      if (d.category !== category || !d.sizeTier) continue;
      map[d.sizeTier]++;
    }
    return map;
  }, [designs, category, hasSizeTiers]);

  const partCounts = useMemo(() => {
    if (!hasCatalogParts) return null;
    const map = { MAIN: 0, HAND_SLEEVES: 0 } as Record<CatalogPart, number>;
    for (const d of designs) {
      if (d.category !== category || !d.catalogPart) continue;
      map[d.catalogPart]++;
    }
    return map;
  }, [designs, category, hasCatalogParts]);

  const categoryDesigns = useMemo(() => {
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

  const prevCategory = useRef(initialCategory);

  useEffect(() => {
    if (prevCategory.current === category) return;
    prevCategory.current = category;
    setSizeTier(defaultSizeTierForCategory(category));
    setCatalogPart(defaultCatalogPartForCategory(category));
  }, [category]);

  useEffect(() => {
    window.history.replaceState(null, "", catalogUrl(category, sizeTier, catalogPart));
  }, [category, sizeTier, catalogPart]);

  function pickCategory(next: ServiceCategory) {
    setCategory(next);
  }

  function pickSizeTier(next: DesignSizeTier) {
    setSizeTier(next);
  }

  function pickCatalogPart(next: CatalogPart) {
    setCatalogPart(next);
  }

  const subgroupReady =
    !needsSubgroup || (hasSizeTiers && sizeTier) || (hasCatalogParts && catalogPart);

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
            <span className="mt-1 block text-xs opacity-90">({counts[c.key] ?? 0})</span>
          </button>
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
          counts={tierCounts ?? undefined}
        />
      )}

      {category && hasCatalogParts && (
        <CatalogPartButtons
          locale={locale}
          category={category}
          active={catalogPart}
          onPick={pickCatalogPart}
          counts={partCounts ?? undefined}
        />
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
