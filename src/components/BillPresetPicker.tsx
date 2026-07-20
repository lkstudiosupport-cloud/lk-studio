"use client";

import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  BILL_PRESET_GROUPS,
  billPresetItemsForGroup,
  type BillPresetItemId,
} from "@/lib/bill-preset-items";

export function BillPresetPicker({
  locale,
  onSelect,
  selectedIds,
}: {
  locale: Locale;
  onSelect: (itemId: BillPresetItemId, label: string) => void;
  /** Preset ids already added to the bill (show as selected). */
  selectedIds?: Set<string>;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-brand-green/15 bg-white p-3 sm:p-4">
      <div>
        <p className="text-sm font-bold text-brand-green">{t(locale, "billPresetPickTitle")}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{t(locale, "billPresetPickHint")}</p>
      </div>

      {BILL_PRESET_GROUPS.map((group) => {
        const items = billPresetItemsForGroup(group.id);
        if (items.length === 0) return null;

        return (
          <section key={group.id} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-brand-green-soft">
              {t(locale, group.labelKey)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => {
                const label = t(locale, item.labelKey);
                const picked = selectedIds?.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id, label)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      picked
                        ? "bg-brand-green text-brand-gold ring-2 ring-inset ring-brand-gold"
                        : "bg-brand-cream text-brand-green ring-1 ring-brand-green/20 hover:bg-brand-green/10"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
