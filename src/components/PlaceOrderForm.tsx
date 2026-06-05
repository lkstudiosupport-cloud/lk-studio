"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { placeOrder } from "@/app/customer/actions";
import { initialActionState } from "@/lib/action-state";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { Design, Person, WorkType } from "@prisma/client";
import { MultiImageUpload } from "./MultiImageUpload";
import { WorkTypeSelect } from "./WorkTypeSelect";
import { CheckCircle2 } from "lucide-react";

export function PlaceOrderForm({
  design,
  locale,
  persons,
  defaultPersonId,
  shopId,
}: {
  design: Design;
  locale: Locale;
  persons: Person[];
  defaultPersonId?: string;
  shopId: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrder, initialActionState);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="designId" value={design.id} />
      <input type="hidden" name="category" value={design.category} />
      <input type="hidden" name="shopId" value={shopId} />

      <WorkTypeSelect locale={locale} defaultValue={design.workType} />

      <select
        name="personId"
        required
        defaultValue={defaultPersonId}
        className="input-premium w-full text-sm"
      >
        <option value="">{t(locale, "person")}</option>
        {persons.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <MultiImageUpload
        namePrefix="orderImg"
        label={t(locale, "uploadRefDesigns")}
        cameraLabel={t(locale, "camera")}
        minHint={t(locale, "morePhotosHint")}
      />

      <textarea name="notes" placeholder={t(locale, "notes")} rows={2} className="input-premium w-full text-sm" />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t(locale, "orderPlaced")}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full text-sm">
        {pending ? "..." : t(locale, "placeOrder")}
      </button>
    </form>
  );
}

export function PlaceOrderCustomForm({
  locale,
  persons,
  defaultPersonId,
  shopId,
  defaultWorkType = "STITCHING",
}: {
  locale: Locale;
  persons: Person[];
  defaultPersonId?: string;
  shopId: string;
  defaultWorkType?: WorkType;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrder, initialActionState);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className="card-premium space-y-3 p-4">
      <h3 className="font-bold text-brand-green">{t(locale, "orderWithOwnDesign")}</h3>
      <input type="hidden" name="shopId" value={shopId} />
      <input type="hidden" name="category" value="BLOUSE_DESIGN" />

      <WorkTypeSelect locale={locale} defaultValue={defaultWorkType} />

      <select name="personId" required defaultValue={defaultPersonId} className="input-premium w-full">
        <option value="">{t(locale, "person")}</option>
        {persons.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <MultiImageUpload
        namePrefix="orderImg"
        label={t(locale, "uploadRefDesignsRequired")}
        cameraLabel={t(locale, "camera")}
        minHint={t(locale, "morePhotosHint")}
      />

      <textarea name="notes" placeholder={t(locale, "notes")} rows={2} className="input-premium w-full" />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-1 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {t(locale, "orderPlaced")}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "..." : t(locale, "placeOrder")}
      </button>
    </form>
  );
}
