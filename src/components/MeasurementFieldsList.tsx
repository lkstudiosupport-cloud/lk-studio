"use client";

import {
  fieldsForType,
  type MeasurementFieldKey,
  type MeasurementRecord,
  type MeasurementTypeId,
} from "@/lib/measurements";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { isCircumferenceField, MEASUREMENT_TYPE_THEMES } from "@/lib/measurement-field-guide";
import { MeasurementFieldGuide } from "./MeasurementFieldGuide";

function fieldLabel(locale: Locale, key: MeasurementFieldKey): string {
  const base = t(locale, key);
  if (isCircumferenceField(key)) {
    return `${base} (${t(locale, "allAround")})`;
  }
  return base;
}

type Props = {
  measurementType: MeasurementTypeId;
  locale: Locale;
  measurement?: MeasurementRecord | null;
  activeField?: MeasurementFieldKey | null;
  onActiveFieldChange?: (key: MeasurementFieldKey | null) => void;
  readOnly?: boolean;
  compact?: boolean;
  /** When set, inputs are rendered with this key prefix for form remounting. */
  inputKeyPrefix?: string;
};

export function MeasurementFieldsList({
  measurementType,
  locale,
  measurement,
  activeField,
  onActiveFieldChange,
  readOnly = false,
  compact = false,
  inputKeyPrefix = "",
}: Props) {
  const theme = MEASUREMENT_TYPE_THEMES[measurementType];
  const fields = fieldsForType(measurementType);

  const visibleFields = readOnly
    ? fields.filter((f) => {
        const v = measurement?.[f.key]?.trim();
        return Boolean(v);
      })
    : fields;

  if (readOnly && visibleFields.length === 0) {
    return null;
  }

  return (
    <ul className={`flex flex-col gap-1.5 ${compact ? "" : "max-h-[min(70vh,520px)] overflow-y-auto pr-1"}`}>
      {visibleFields.map((f) => {
        const isActive = activeField === f.key;
        const value = measurement?.[f.key]?.trim() ?? "";

        return (
          <li
            key={f.key}
            className={`flex items-center gap-2 rounded-xl border px-2 py-2 transition sm:gap-3 sm:px-3 ${
              theme.rowBorder
            } ${isActive ? theme.rowActiveBg : theme.rowBg} ${compact ? "py-1.5" : ""}`}
          >
            <MeasurementFieldGuide
              measurementType={measurementType}
              fieldKey={f.key}
              active={isActive}
              className={compact ? "h-12 w-9 shrink-0" : "h-16 w-12 shrink-0"}
            />

            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold leading-tight ${theme.accent} ${compact ? "text-[11px]" : ""}`}>
                {fieldLabel(locale, f.key)}
              </p>
              {readOnly && (
                <p className="text-sm font-bold text-zinc-900">
                  {value}
                  <span className="text-xs font-medium text-zinc-500">&quot;</span>
                </p>
              )}
            </div>

            {!readOnly && (
              <input
                name={f.key}
                defaultValue={value}
                key={`${inputKeyPrefix}-${measurementType}-${f.key}-${value}`}
                placeholder='14"'
                onFocus={() => onActiveFieldChange?.(f.key)}
                onBlur={() => onActiveFieldChange?.(null)}
                className={`input-premium shrink-0 text-right ${compact ? "w-20 text-sm" : "w-24"}`}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
