"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { askPrice } from "@/app/customer/actions";
import { initialActionState } from "@/lib/action-state";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import { FormPhotoAdd } from "./FormPhotoAdd";
import { CheckCircle2, IndianRupee } from "lucide-react";
import type { Design } from "@prisma/client";
import { CATEGORIES } from "@/lib/categories";

export function AskPriceForm({
  locale,
  shopId,
  design,
  compact,
}: {
  locale: Locale;
  shopId: string;
  design?: Pick<Design, "id" | "title" | "category">;
  compact?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(askPrice, initialActionState);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className={compact ? "space-y-2" : "space-y-3"}>
      <input type="hidden" name="shopId" value={shopId} />
      {design && (
        <>
          <input type="hidden" name="designId" value={design.id} />
          <input type="hidden" name="category" value={design.category} />
        </>
      )}

      {!compact && (
        <div className="flex items-center gap-2 text-brand-green">
          <IndianRupee className="h-4 w-4" />
          <p className="text-sm font-bold">
            {design ? t(locale, "askPriceForDesign") : t(locale, "askPrice")}
          </p>
        </div>
      )}

      {design && compact && (
        <p className="text-[11px] font-medium text-zinc-600">{t(locale, "askPriceShort")}</p>
      )}

      {design && !compact && (
        <p className="text-xs text-zinc-500">
          {design.title} · {t(locale, categoryLabelKey(design.category))}
        </p>
      )}

      {!design && (
        <select name="category" required className="input-premium w-full text-sm">
          <option value="">{t(locale, "selectCategory")}</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {t(locale, c.labelKey)}
            </option>
          ))}
        </select>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold text-brand-green">
          {design ? t(locale, "optionalOwnPhoto") : t(locale, "uploadOwnDesignPhoto")}
        </p>
        <FormPhotoAdd locale={locale} name="customerImage" compact={compact} />
      </div>

      <textarea
        name="notes"
        placeholder={t(locale, "askPriceNotesPlaceholder")}
        rows={compact ? 2 : 3}
        className="input-premium w-full text-sm"
      />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t(locale, "priceRequestSent")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`btn-primary w-full ${compact ? "text-xs py-2" : "text-sm"}`}
      >
        {pending ? "..." : t(locale, "askPrice")}
      </button>
    </form>
  );
}

export function AskPriceOwnDesignCard({
  locale,
  shopId,
}: {
  locale: Locale;
  shopId: string;
}) {
  return (
    <div className="card-premium space-y-3 p-4">
      <h3 className="font-bold text-brand-green">{t(locale, "askPriceOwnDesign")}</h3>
      <p className="text-sm text-zinc-600">{t(locale, "askPriceOwnDesignHint")}</p>
      <AskPriceForm locale={locale} shopId={shopId} />
    </div>
  );
}
