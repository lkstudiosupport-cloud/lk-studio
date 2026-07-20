"use client";

import { useState } from "react";
import { MEASUREMENT_TYPES, type MeasurementTypeId } from "@/lib/measurements";
import { MEASUREMENT_TYPE_THEMES } from "@/lib/measurement-field-guide";
import { MeasurementFieldsList } from "@/components/MeasurementFieldsList";
import { VoiceInput } from "@/components/VoiceInput";
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
  const [personName, setPersonName] = useState(
    () => initialData?.personName ?? defaultPersonName ?? ""
  );

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">
          {t(locale, "measurementPersonLabel")}
        </span>
        <input type="hidden" name="shopMeasurementPersonName" value={personName} readOnly />
        <VoiceInput
          locale={locale}
          value={personName}
          onChange={setPersonName}
          placeholder={t(locale, "person")}
          className="w-full"
          micVariant="micInside"
          aria-label={t(locale, "measurementPersonLabel")}
          micErrorLabel={t(locale, "micPermissionError")}
          startLabel={t(locale, "startListening")}
          stopLabel={t(locale, "stopListening")}
        />
        <p className="mt-1 text-xs text-zinc-500">{t(locale, "voiceNameHint")}</p>
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
