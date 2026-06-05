import { WORK_TYPES, workTypeLabelKey } from "@/lib/work-types";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { WorkType } from "@prisma/client";

export function WorkTypeSelect({
  locale,
  name = "workType",
  defaultValue = "STITCHING",
}: {
  locale: Locale;
  name?: string;
  defaultValue?: WorkType;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {WORK_TYPES.map((w) => (
        <label
          key={w}
          className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
            w === "STITCHING"
              ? "border-brand-green/20 has-[:checked]:border-brand-gold has-[:checked]:bg-brand-green/10 has-[:checked]:text-brand-green"
              : "border-amber-300 has-[:checked]:border-amber-600 has-[:checked]:bg-amber-100 has-[:checked]:text-amber-900"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={w}
            defaultChecked={defaultValue === w}
            className="sr-only"
          />
          {t(locale, workTypeLabelKey(w))}
        </label>
      ))}
    </div>
  );
}
