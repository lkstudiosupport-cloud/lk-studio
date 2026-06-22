"use client";

import { useState } from "react";
import { MEASUREMENT_TYPES, type MeasurementTypeId } from "@/lib/measurements";
import { MEASUREMENT_TYPE_THEMES } from "@/lib/measurement-field-guide";
import { MeasurementFieldsList } from "@/components/MeasurementFieldsList";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { MeasurementFieldKey } from "@/lib/measurements";
import type { ShopMeasurementsData } from "@/lib/shop-measurements";
import { shopMeasurementsToRecord } from "@/lib/shop-measurements";

export function ShopManualMeasurementsForm({
  locale,
  defaultPersonName,
  initialData,
}: {
  locale: Locale;
  defaultPersonName?: string;
  initialData?: ShopMeasurementsData;
}) {
  const [measureType, setMeasureType] = useState<MeasurementTypeId>(
    initialData?.type ?? "blouse"
  );
  const [activeField, setActiveField] = useState<MeasurementFieldKey | null>(null);
  const initialRecord = initialData ? shopMeasurementsToRecord(initialData) : null;
  const personNameDefault = initialData?.personName ?? defaultPersonName ?? "";

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">
          {t(locale, "measurementPersonLabel")}
        </span>
        <input
          name="shopMeasurementPersonName"
          defaultValue={personNameDefault}
          placeholder={t(locale, "person")}
          className="input-premium w-full"
        />
      </label>

      <input type="hidden" name="shopMeasurementType" value={measureType} readOnly />

      <div>
        <span className="mb-2 block text-sm font-semibold text-brand-green">
          {t(locale, "measurementType")}
        </span>
        <div className="flex flex-wrap gap-2">
          {MEASUREMENT_TYPES.map((type) => {
            const theme = MEASUREMENT_TYPE_THEMES[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setMeasureType(type)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  measureType === type
                    ? `${theme.rowBg} ${theme.accent} ring-2 ring-brand-gold ring-offset-1`
                    : `${theme.rowBg} ${theme.accent} opacity-75`
                }`}
              >
                {t(locale, `measurementType_${type}`)}
              </button>
            );
          })}
        </div>
      </div>

      <MeasurementFieldsList
        key={`${measureType}-${initialData ? "prefill" : "empty"}`}
        measurementType={measureType}
        locale={locale}
        measurement={initialRecord}
        activeField={activeField}
        onActiveFieldChange={setActiveField}
        fieldNamePrefix="shopMeas"
        inputKeyPrefix="shopMeas"
      />
    </div>
  );
}
