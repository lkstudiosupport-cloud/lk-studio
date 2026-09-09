"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { WorkerPartnerDurationType, WorkerPartnerRole } from "@prisma/client";
import { WORKER_PARTNER_ROLES, workerPartnerRoleLabelKey } from "@/lib/work-partner-roles";
import {
  todayDateInputValue,
  WORKER_PARTNER_DURATION_TYPES,
  workerPartnerDurationLabelKey,
} from "@/lib/work-partner-duration";
import { createWorkerPartnerRequest } from "@/app/shop/actions";
import { VoiceNotes } from "@/components/VoiceNotes";

export function ShopWorkPartnerRequestForm({
  locale,
  onCreated,
}: {
  locale: Locale;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<WorkerPartnerRole>("STITCHING_WORKER");
  const [durationType, setDurationType] = useState<WorkerPartnerDurationType>("ONE_DAY");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("role", role);
    fd.set("durationType", durationType);
    try {
      await createWorkerPartnerRequest(fd);
      form.reset();
      setRole("STITCHING_WORKER");
      setDurationType("ONE_DAY");
      onCreated?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    el.focus();
    try {
      // Chromium / Android WebView
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      /* ignore — native date UI still opens on tap */
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-premium space-y-4 p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-brand-green">{t(locale, "workerPartnerRequestTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "workerPartnerRequestHint")}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-brand-green">
          {t(locale, "workerPartnerRoleLabel")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {WORKER_PARTNER_ROLES.map((r) => (
            <label
              key={r}
              className={`cursor-pointer rounded-full px-3 py-2 text-xs font-semibold sm:text-sm ${
                role === r
                  ? "bg-brand-green text-brand-gold ring-2 ring-inset ring-brand-gold"
                  : "bg-brand-cream text-brand-green ring-1 ring-brand-green/15"
              }`}
            >
              <input
                type="radio"
                name="rolePick"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="sr-only"
              />
              {t(locale, workerPartnerRoleLabelKey(r))}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <span className="mb-1 block text-sm font-semibold text-brand-green">
          {t(locale, "workerPartnerNeededFrom")}
        </span>
        <div className="relative">
          <input
            ref={dateInputRef}
            type="date"
            name="neededFrom"
            required
            min={todayDateInputValue()}
            className="input-premium w-full pe-12"
            onClick={openDatePicker}
          />
          <button
            type="button"
            onClick={openDatePicker}
            className="absolute inset-y-0 end-0 flex items-center px-3 text-brand-green"
            aria-label={t(locale, "workerPartnerSelectDate")}
          >
            <Calendar className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">{t(locale, "workerPartnerSelectDate")}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-brand-green">
          {t(locale, "workerPartnerDurationLabel")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {WORKER_PARTNER_DURATION_TYPES.map((d) => (
            <label
              key={d}
              className={`cursor-pointer rounded-full px-3 py-2 text-xs font-semibold sm:text-sm ${
                durationType === d
                  ? "bg-brand-green text-brand-gold ring-2 ring-inset ring-brand-gold"
                  : "bg-brand-cream text-brand-green ring-1 ring-brand-green/15"
              }`}
            >
              <input
                type="radio"
                name="durationPick"
                value={d}
                checked={durationType === d}
                onChange={() => setDurationType(d)}
                className="sr-only"
              />
              {t(locale, workerPartnerDurationLabelKey(d))}
            </label>
          ))}
        </div>
      </fieldset>

      {durationType === "CUSTOM_DAYS" && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-green">
            {t(locale, "workerPartnerCustomDays")}
          </span>
          <input
            type="number"
            name="customDays"
            required
            min={3}
            max={90}
            defaultValue={3}
            className="input-premium w-full"
          />
        </label>
      )}

      <VoiceNotes
        locale={locale}
        fieldName="notes"
        textLabel={t(locale, "workerPartnerNotes")}
        hintLabel={t(locale, "voiceDictationHint")}
        startLabel={t(locale, "startListening")}
        stopLabel={t(locale, "stopListening")}
        micErrorLabel={t(locale, "micPermissionError")}
        transliterate
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? "..." : t(locale, "workerPartnerSubmitRequest")}
      </button>
    </form>
  );
}
