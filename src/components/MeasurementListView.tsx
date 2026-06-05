import {
  measurementEntries,
  type MeasurementRecord,
  type MeasurementTypeId,
} from "@/lib/measurements";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { Ruler } from "lucide-react";
import { MeasurementDiagram } from "./MeasurementDiagram";

export function MeasurementListView({
  measurement,
  measurementType = "blouse",
  locale,
  compact,
  showDiagram = true,
}: {
  measurement: MeasurementRecord | null | undefined;
  measurementType?: MeasurementTypeId;
  locale: Locale;
  compact?: boolean;
  showDiagram?: boolean;
}) {
  const rows = measurementEntries(measurement, measurementType).map((e) => ({
    key: e.key,
    label: t(locale, e.key),
    value: e.value,
  }));

  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {t(locale, "noMeasurements")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
        {t(locale, `measurementType_${measurementType}`)} {t(locale, "measurements")}
      </p>

      {showDiagram && !compact && (
        <MeasurementDiagram
          measurementType={measurementType}
          locale={locale}
          measurement={measurement}
          advanced
        />
      )}

      <ul
        className={`grid gap-2 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
      >
        {rows.map((r) => (
          <li
            key={r.key}
            className="flex items-center gap-2 rounded-xl border border-brand-green/10 bg-brand-cream/60 px-3 py-2"
          >
            <Ruler className="h-4 w-4 shrink-0 text-brand-green" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-brand-green">{r.label}</p>
              <p className="text-sm font-bold text-zinc-900">{r.value}&quot;</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
