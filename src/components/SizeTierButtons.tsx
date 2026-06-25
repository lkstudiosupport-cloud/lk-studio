import type { DesignSizeTier } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { DESIGN_SIZE_TIERS, sizeTierLabelKey } from "@/lib/design-size-tier";

export function SizeTierButtons({
  locale,
  active,
  onPick,
  counts,
  showUnassigned,
  unassignedCount,
  unassignedActive,
  onPickUnassigned,
}: {
  locale: Locale;
  active?: DesignSizeTier;
  onPick: (tier: DesignSizeTier) => void;
  counts?: Partial<Record<DesignSizeTier, number>>;
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
          {t(locale, "sizeTierUnassigned")}
          {unassignedCount != null ? ` (${unassignedCount})` : ""}
        </button>
      )}
      {DESIGN_SIZE_TIERS.map((tier) => (
        <button
          key={tier}
          type="button"
          onClick={() => onPick(tier)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
            active === tier
              ? "bg-brand-green text-brand-gold ring-2 ring-inset ring-brand-gold"
              : "bg-brand-cream text-brand-green ring-1 ring-brand-green/15 hover:bg-brand-green/10"
          }`}
        >
          {t(locale, sizeTierLabelKey(tier))}
          {counts ? ` (${counts[tier] ?? 0})` : ""}
        </button>
      ))}
    </div>
  );
}
