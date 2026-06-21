"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import type { DesignListItem } from "@/lib/design-queries";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { SizeTierButtons } from "@/components/SizeTierButtons";
import { withQueryParam } from "@/lib/query-string";
import type { DesignSizeTier } from "@prisma/client";

export function CustomerCatalogPanel({
  locale,
  designs,
  favoriteDesignIds,
  priceShopId,
  initialCategory,
  initialSizeTier,
}: {
  locale: Locale;
  designs: DesignListItem[];
  favoriteDesignIds: string[];
  priceShopId?: string;
  initialCategory?: ServiceCategory;
  initialSizeTier?: DesignSizeTier;
}) {
  const tabs = CATEGORIES.filter((c) => CATALOG_CATEGORIES.includes(c.key));
  const [category, setCategory] = useState<ServiceCategory | undefined>(initialCategory);
  const [sizeTier, setSizeTier] = useState<DesignSizeTier | undefined>(initialSizeTier);

  const favorites = useMemo(() => new Set(favoriteDesignIds), [favoriteDesignIds]);
  const hasSizeTiers = category ? categoryHasSizeTiers(category) : false;

  const tierCounts = useMemo(() => {
    if (!category || !hasSizeTiers) return null;
    const counts = { SMALL: 0, MEDIUM: 0, BIG: 0 } as Record<DesignSizeTier, number>;
    for (const d of designs) {
      if (d.category !== category || !d.sizeTier) continue;
      counts[d.sizeTier]++;
    }
    return counts;
  }, [designs, category, hasSizeTiers]);

  const categoryDesigns = useMemo(() => {
    if (!category) return [];
    let list = designs.filter((d) => d.category === category);
    if (hasSizeTiers) {
      if (!sizeTier) return [];
      list = list.filter((d) => d.sizeTier === sizeTier);
    }
    return list;
  }, [designs, category, hasSizeTiers, sizeTier]);

  const counts = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const c of tabs) {
      map[c.key] = designs.filter((d) => {
        if (d.category !== c.key) return false;
        if (categoryHasSizeTiers(c.key)) return !!d.sizeTier;
        return true;
      }).length;
    }
    return map;
  }, [designs, tabs]);

  function pickCategory(next: ServiceCategory) {
    setCategory(next);
    setSizeTier(undefined);
    const url = withQueryParam("/customer/designs", "category", next);
    window.history.replaceState(null, "", url);
  }

  function pickSizeTier(next: DesignSizeTier) {
    setSizeTier(next);
    if (!category) return;
    const url = withQueryParam(
      withQueryParam("/customer/designs", "category", category),
      "size",
      next
    );
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "designs")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "customerCatalogDesignsHint")}</p>
        {category && (
          <p className="mt-1 text-sm text-zinc-500">
            {categoryDesigns.length} {t(locale, "collectionItems")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tabs.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pickCategory(c.key)}
            className={`min-h-[4.5rem] rounded-2xl p-3 text-center text-sm font-semibold shadow-md transition active:scale-[0.98] hover:opacity-90 ${
              c.color
            } ${category === c.key ? "ring-4 ring-brand-gold ring-offset-2" : ""}`}
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

      {category && (!hasSizeTiers || sizeTier) && (
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
