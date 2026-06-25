import type { CatalogPart, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  CATALOG_PARTS,
  catalogPartLabelKey,
} from "@/lib/design-catalog-part";

export function CatalogPartButtons({
  locale,
  category,
  active,
  onPick,
  counts,
  showUnassigned,
  unassignedCount,
  unassignedActive,
  onPickUnassigned,
}: {
  locale: Locale;
  category: ServiceCategory;
  active?: CatalogPart;
  onPick: (part: CatalogPart) => void;
  counts?: Partial<Record<CatalogPart, number>>;
  showUnassigned?: boolean;
  unassignedCount?: number;
  unassignedActive?: boolean;
  onPickUnassigned?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {showUnassigned && onPickUnassigned && (
        <button
          type="button"
          onClick={onPickUnassigned}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            unassignedActive
              ? "bg-amber-500 text-white ring-2 ring-inset ring-brand-gold"
              : "bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
          }`}
        >
          {t(locale, "sizeTierUnassigned")} ({unassignedCount ?? 0})
        </button>
      )}
      {CATALOG_PARTS.map((part) => (
        <button
          key={part}
          type="button"
          onClick={() => onPick(part)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
            active === part
              ? "bg-brand-green text-brand-gold ring-2 ring-inset ring-brand-gold"
              : "bg-brand-cream text-brand-green ring-1 ring-brand-green/15 hover:bg-brand-green/10"
          }`}
        >
          {t(locale, catalogPartLabelKey(category, part))}
          {counts ? ` (${counts[part] ?? 0})` : ""}
        </button>
      ))}
    </div>
  );
}
