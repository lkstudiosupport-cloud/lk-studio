"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MEASUREMENT_TYPES,
  pickMeasurementForType,
  type MeasurementFieldKey,
  type MeasurementTypeId,
  type SavedMeasurement,
} from "@/lib/measurements";
import { MEASUREMENT_TYPE_THEMES } from "@/lib/measurement-field-guide";
import { MeasurementFieldsList } from "./MeasurementFieldsList";
import { saveMeasurements, updatePerson, deletePerson, deletePersonMeasurements } from "@/app/customer/actions";
import { initialActionState } from "@/lib/action-state";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { PersonPhotos } from "@/components/PersonPhotos";
import { ChevronDown, ChevronUp, User, CheckCircle2, Shirt, Trash2 } from "lucide-react";
type Props = {
  personId: string;
  personName: string;
  relation?: string | null;
  photosJson?: string | null;
  locale: Locale;
  measurements?: SavedMeasurement[];
  footer?: React.ReactNode;
};

export function MeasurementForm({
  personId,
  personName,
  relation,
  photosJson,
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

  const typeTheme = MEASUREMENT_TYPE_THEMES[measureType];

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
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deletePending, startDelete] = useTransition();

  const hasSavedForType = savedTypes.includes(measureType);

  useEffect(() => {
    if (measureState.ok || personState.ok) {
      router.refresh();
    }
  }, [measureState.ok, personState.ok, router]);

  function onDeleteMeasurements() {
    if (!confirm(t(locale, "deleteMeasurementsConfirm"))) return;
    setDeleteError("");
    setDeleteSuccess(null);
    const fd = new FormData();
    fd.set("personId", personId);
    fd.set("measurementType", measureType);
    startDelete(async () => {
      const result = await deletePersonMeasurements(initialActionState, fd);
      if (!result.ok) {
        setDeleteError(
          result.error === "personHasOrders"
            ? t(locale, "personHasOrders")
            : (result.error ?? t(locale, "deletePhotoFailed"))
        );
        return;
      }
      setDeleteSuccess(t(locale, "measurementsDeleted"));
      setActive(null);
      router.refresh();
    });
  }

  function onDeletePerson() {
    if (!confirm(t(locale, "deletePersonConfirm"))) return;
    setDeleteError("");
    setDeleteSuccess(null);
    const fd = new FormData();
    fd.set("personId", personId);
    startDelete(async () => {
      const result = await deletePerson(initialActionState, fd);
      if (!result.ok) {
        setDeleteError(
          result.error === "personHasOrders"
            ? t(locale, "personHasOrders")
            : (result.error ?? t(locale, "deletePhotoFailed"))
        );
        return;
      }
      router.refresh();
    });
  }

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
          {deleteSuccess && (
            <p className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {deleteSuccess}
            </p>
          )}
          {(measureState.error || personState.error) && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {measureState.error || personState.error}
            </p>
          )}

          <PersonPhotos personId={personId} locale={locale} photosJson={photosJson ?? null} />

          <form action={personAction} className="mb-4 rounded-xl bg-brand-cream/80 p-3">
            <input type="hidden" name="personId" value={personId} />
            <div className="grid gap-2 sm:grid-cols-3">
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
              <button type="submit" disabled={personPending || deletePending} className="btn-primary text-sm">
                {personPending ? "..." : t(locale, "saveName")}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-green/10 pt-3">
              <button
                type="button"
                onClick={onDeletePerson}
                disabled={deletePending || measurePending || personPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                {deletePending ? "..." : t(locale, "deletePerson")}
              </button>
            </div>
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

            <div className={`rounded-xl border p-3 ${typeTheme.rowBorder} ${typeTheme.rowBg}`}>
              <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${typeTheme.accent}`}>
                {t(locale, "measurementFieldsFor")} {t(locale, `measurementType_${measureType}`)}
              </p>
              <MeasurementFieldsList
                measurementType={measureType}
                locale={locale}
                measurement={currentMeasurement}
                activeField={active}
                onActiveFieldChange={setActive}
                inputKeyPrefix={personId}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={measurePending || deletePending} className="btn-primary w-full sm:w-auto">
                {measurePending ? "..." : `${t(locale, "save")} ${t(locale, `measurementType_${measureType}`)} ${t(locale, "measurements")}`}
              </button>
              {hasSavedForType && (
                <button
                  type="button"
                  onClick={onDeleteMeasurements}
                  disabled={deletePending || measurePending}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletePending ? "..." : t(locale, "deleteMeasurements")}
                </button>
              )}
            </div>
          </form>

          {deleteError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>
          )}

          {footer && <div className="mt-4 border-t border-zinc-100 pt-4">{footer}</div>}
        </div>
      )}
    </article>
  );
}
