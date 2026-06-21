"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import type { DesignListItem } from "@/lib/design-queries";
import { ShopDesignCollections } from "@/components/ShopDesignCollections";
import { withQueryParam } from "@/lib/query-string";

export function CustomerCatalogPanel({
  locale,
  designs,
  favoriteDesignIds,
  priceShopId,
  initialCategory,
}: {
  locale: Locale;
  designs: DesignListItem[];
  favoriteDesignIds: string[];
  priceShopId?: string;
  initialCategory?: ServiceCategory;
}) {
  const tabs = CATEGORIES.filter((c) => CATALOG_CATEGORIES.includes(c.key));
  const [category, setCategory] = useState<ServiceCategory | undefined>(initialCategory);

  const favorites = useMemo(() => new Set(favoriteDesignIds), [favoriteDesignIds]);

  const counts = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const c of tabs) {
      map[c.key] = designs.filter((d) => d.category === c.key).length;
    }
    return map;
  }, [designs, tabs]);

  const categoryDesigns = useMemo(() => {
    if (!category) return [];
    return designs.filter((d) => d.category === category);
  }, [designs, category]);

  function pickCategory(next: ServiceCategory) {
    setCategory(next);
    const url = withQueryParam("/customer/designs", "category", next);
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

      {category && (
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
