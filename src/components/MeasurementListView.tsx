import {
  measurementEntries,
  type MeasurementRecord,
  type MeasurementTypeId,
} from "@/lib/measurements";
import { MEASUREMENT_TYPE_THEMES } from "@/lib/measurement-field-guide";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { MeasurementFieldsList } from "./MeasurementFieldsList";

export function MeasurementListView({
  measurement,
  measurementType = "blouse",
  locale,
  compact,
  /** @deprecated Diagram removed; prop kept for backward compatibility. */
  showDiagram: _showDiagram,
}: {
  measurement: MeasurementRecord | null | undefined;
  measurementType?: MeasurementTypeId;
  locale: Locale;
  compact?: boolean;
  showDiagram?: boolean;
}) {
  const theme = MEASUREMENT_TYPE_THEMES[measurementType];
  const rows = measurementEntries(measurement, measurementType);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {t(locale, "noMeasurements")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className={`text-xs font-semibold uppercase tracking-wide ${theme.accent}`}>
        {t(locale, `measurementType_${measurementType}`)} {t(locale, "measurements")}
      </p>

      <MeasurementFieldsList
        measurementType={measurementType}
        locale={locale}
        measurement={measurement}
        readOnly
        compact={compact}
      />
    </div>
  );
}
