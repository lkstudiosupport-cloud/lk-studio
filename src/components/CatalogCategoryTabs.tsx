"use client";

import type { ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function CatalogCategoryTabs({
  locale,
  tabs,
  active,
  counts,
  onPick,
  onPrefetch,
}: {
  locale: Locale;
  tabs: { key: ServiceCategory; labelKey: string; color: string }[];
  active: ServiceCategory;
  counts: Partial<Record<ServiceCategory, number>>;
  onPick: (category: ServiceCategory) => void;
  onPrefetch?: (category: ServiceCategory) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {tabs.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onPick(c.key)}
          onMouseEnter={() => onPrefetch?.(c.key)}
          onTouchStart={() => onPrefetch?.(c.key)}
          className={`min-h-[4rem] rounded-2xl p-2.5 text-center text-xs font-semibold shadow-md transition hover:opacity-100 sm:min-h-[4.5rem] sm:p-3 sm:text-sm ${
            c.color
          } ${active === c.key ? "category-tab-active" : "opacity-90"}`}
        >
          <span className="block leading-tight">{t(locale, c.labelKey)}</span>
          <span className="mt-1 block text-xs opacity-90">({counts[c.key] ?? 0})</span>
        </button>
      ))}
    </div>
  );
}
