"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fieldsForType,
  MEASUREMENT_TYPES,
  pickMeasurementForType,
  type MeasurementFieldKey,
  type MeasurementTypeId,
  type SavedMeasurement,
} from "@/lib/measurements";
import { MeasurementDiagram } from "./MeasurementDiagram";
import { saveMeasurements, updatePerson } from "@/app/customer/actions";
import { initialActionState } from "@/lib/action-state";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { ChevronDown, ChevronUp, User, CheckCircle2, Shirt } from "lucide-react";
type Props = {
  personId: string;
  personName: string;
  relation?: string | null;
  locale: Locale;
  measurements?: SavedMeasurement[];
  footer?: React.ReactNode;
};

export function MeasurementForm({
  personId,
  personName,
  relation,
  locale,
  measurements = [],
  footer,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [measureType, setMeasureType] = useState<MeasurementTypeId>("blouse");
  const [active, setActive] = useState<MeasurementFieldKey | null>(null);
  const [name, setName] = useState(personName);
  const [rel, setRel] = useState(relation ?? "");

  const currentMeasurement = useMemo(
    () => pickMeasurementForType(measurements, measureType),
    [measurements, measureType]
  );

  const typeFields = fieldsForType(measureType);

  const savedTypes = useMemo(
    () =>
      MEASUREMENT_TYPES.filter((type) => {
        const m = pickMeasurementForType(measurements, type);
        return m && Object.values(m).some((v) => typeof v === "string" && v.trim());
      }),
    [measurements]
  );

  const [measureState, measureAction, measurePending] = useActionState(
    saveMeasurements,
    initialActionState
  );
  const [personState, personAction, personPending] = useActionState(
    updatePerson,
    initialActionState
  );

  useEffect(() => {
    if (measureState.ok || personState.ok) {
      router.refresh();
    }
  }, [measureState.ok, personState.ok, router]);

  const savedMsg = measureState.ok
    ? t(locale, "measurementsSaved")
    : personState.ok
      ? t(locale, "personUpdated")
      : null;

  return (
    <article className="card-premium overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 bg-gradient-to-r from-brand-green via-brand-green-light to-brand-green-soft px-4 py-4 text-left text-white"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{name}</p>
          {rel && <p className="text-sm text-white/85">{rel}</p>}
          {savedTypes.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {savedTypes.map((type) => t(locale, `measurementType_${type}`)).join(" · ")}
            </p>
          )}
        </div>
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {open && (
        <div className="border-t border-brand-green/10 bg-white p-4">
          {savedMsg && (
            <p className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {savedMsg}
            </p>
          )}
          {(measureState.error || personState.error) && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {measureState.error || personState.error}
            </p>
          )}

          <form action={personAction} className="mb-4 grid gap-2 rounded-xl bg-brand-cream/80 p-3 sm:grid-cols-3">
            <input type="hidden" name="personId" value={personId} />
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t(locale, "name")}
              className="input-premium"
            />
            <input
              name="relation"
              value={rel}
              onChange={(e) => setRel(e.target.value)}
              className="input-premium"
              placeholder={t(locale, "relation")}
            />
            <button type="submit" disabled={personPending} className="btn-primary text-sm">
              {personPending ? "..." : t(locale, "saveName")}
            </button>
          </form>

          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-green">
            <User className="h-4 w-4" />
            {t(locale, "measurementsInside")}
          </div>

          <div className="mb-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
              <Shirt className="h-3.5 w-3.5" />
              {t(locale, "measurementTypeSelect")}
            </p>
            <div className="flex flex-wrap gap-2">
              {MEASUREMENT_TYPES.map((type) => {
                const hasSaved = savedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setMeasureType(type);
                      setActive(null);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      measureType === type
                        ? "bg-brand-green text-brand-gold shadow-md"
                        : "bg-brand-cream text-brand-green ring-1 ring-brand-green/20 hover:ring-brand-green/40"
                    }`}
                  >
                    {t(locale, `measurementType_${type}`)}
                    {hasSaved && <span className="ml-1.5 text-xs opacity-80">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <form action={measureAction} className="space-y-4">
            <input type="hidden" name="personId" value={personId} />
            <input type="hidden" name="measurementType" value={measureType} />

            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <MeasurementDiagram
                measurementType={measureType}
                activeField={active}
                locale={locale}
                measurement={currentMeasurement}
                advanced
              />

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-green">
                  {t(locale, "measurementFieldsFor")} {t(locale, `measurementType_${measureType}`)}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {typeFields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="mb-1 block text-xs font-semibold text-brand-green">
                        {f.letter && (
                          <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-bold text-white">
                            {f.letter}
                          </span>
                        )}
                        {t(locale, f.key)}
                      </span>
                      <input
                        name={f.key}
                        defaultValue={currentMeasurement?.[f.key] ?? ""}
                        key={`${personId}-${measureType}-${f.key}-${currentMeasurement?.[f.key] ?? ""}`}
                        placeholder='e.g. 14"'
                        onFocus={() => setActive(f.key)}
                        onBlur={() => setActive(null)}
                        className="input-premium w-full"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={measurePending} className="btn-primary w-full sm:w-auto">
              {measurePending ? "..." : `${t(locale, "save")} ${t(locale, `measurementType_${measureType}`)} ${t(locale, "measurements")}`}
            </button>
          </form>

          {footer && <div className="mt-4 border-t border-zinc-100 pt-4">{footer}</div>}
        </div>
      )}
    </article>
  );
}
