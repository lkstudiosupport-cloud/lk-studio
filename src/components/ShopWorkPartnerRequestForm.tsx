"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { WorkerPartnerRole } from "@prisma/client";
import { WORKER_PARTNER_ROLES, workerPartnerRoleLabelKey } from "@/lib/work-partner-roles";
import { createWorkerPartnerRequest } from "@/app/shop/actions";

export function ShopWorkPartnerRequestForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [role, setRole] = useState<WorkerPartnerRole>("STITCHING_WORKER");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("role", role);
    try {
      await createWorkerPartnerRequest(fd);
      e.currentTarget.reset();
      setRole("STITCHING_WORKER");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setPending(false);
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

      {role === "OTHER" && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-green">
            {t(locale, "workerPartnerCustomRole")}
          </span>
          <input
            name="customRole"
            required
            className="input-premium w-full"
            placeholder={t(locale, "workerPartnerCustomRolePlaceholder")}
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">
          {t(locale, "workerPartnerNotes")}
        </span>
        <textarea
          name="notes"
          rows={3}
          className="input-premium w-full"
          placeholder={t(locale, "workerPartnerNotesPlaceholder")}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? "..." : t(locale, "workerPartnerSubmitRequest")}
      </button>
    </form>
  );
}
