"use client";

import { useState } from "react";
import { updateOrderWork } from "@/app/shop/actions";
import { FormPhotoAdd } from "./FormPhotoAdd";
import { MultiImageUpload } from "./MultiImageUpload";
import { WorkTypeSelect } from "./WorkTypeSelect";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { STITCH_TYPE_KEYS } from "@/lib/stitch-types";
import type { WorkType } from "@prisma/client";
import { UserRound } from "lucide-react";

export function ShopOrderWorkForm({
  orderId,
  personName,
  locale,
  stitchType,
  clothDescription,
  workType,
}: {
  orderId: string;
  personName: string;
  locale: Locale;
  stitchType: string | null;
  clothDescription: string | null;
  workType: WorkType;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        await updateOrderWork(fd);
        setPending(false);
      }}
      className="rounded-2xl border-2 border-dashed border-brand-green/15 bg-brand-cream/30 p-4"
    >
      <h3 className="mb-3 flex items-center gap-2 font-bold text-brand-green">
        <UserRound className="h-5 w-5" />
        {t(locale, "updateWorkFor")} — {personName}
      </h3>
      <input type="hidden" name="orderId" value={orderId} />

      <div className="mb-3">
        <p className="mb-1 text-xs font-semibold text-brand-green">{t(locale, "workTypeLabel")}</p>
        <WorkTypeSelect locale={locale} defaultValue={workType} />
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-brand-green">
            {t(locale, "stitchType")}
          </span>
          <select name="stitchType" defaultValue={stitchType ?? ""} className="input-premium w-full">
            <option value="">{t(locale, "selectStitch")}</option>
            {STITCH_TYPE_KEYS.map((k) => (
              <option key={k} value={k}>
                {t(locale, `stitch.${k}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-brand-green">
            {t(locale, "clothNote")}
          </span>
          <input
            name="clothDescription"
            defaultValue={clothDescription ?? ""}
            placeholder={t(locale, "clothNotePlaceholder")}
            className="input-premium w-full"
          />
        </label>

        <div>
          <p className="mb-1 text-xs font-semibold text-brand-green">{t(locale, "uploadClothPhoto")}</p>
          <p className="mb-2 text-xs text-zinc-500">{t(locale, "clothPhotoHint")}</p>
          <FormPhotoAdd locale={locale} name="clothImage" compact />
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-brand-green">{t(locale, "uploadWorkPhotos")}</p>
          <p className="mb-2 text-xs text-zinc-500">{t(locale, "workPhotosHint")}</p>
          <MultiImageUpload
            namePrefix="workImg"
            label={t(locale, "workPhotos")}
            cameraLabel={t(locale, "camera")}
            minHint={t(locale, "morePhotosHint")}
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary mt-4 w-full">
        {pending ? "..." : t(locale, "saveWorkDetails")}
      </button>
    </form>
  );
}
