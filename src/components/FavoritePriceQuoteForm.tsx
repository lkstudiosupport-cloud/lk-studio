"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { askPrice } from "@/app/customer/actions";
import { initialActionState } from "@/lib/action-state";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import { FormPhotoAdd } from "@/components/FormPhotoAdd";
import { CheckCircle2, IndianRupee } from "lucide-react";
import type { ServiceCategory } from "@prisma/client";

type FavoriteDesign = {
  id: string;
  category: ServiceCategory;
  design: {
    id: string;
    title: string;
    imagePath: string;
  };
};

export function FavoritePriceQuoteForm({
  locale,
  shopId,
  shopName,
  favorites,
}: {
  locale: Locale;
  shopId: string;
  shopName: string;
  favorites: FavoriteDesign[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(askPrice, initialActionState);
  const allIds = useMemo(() => favorites.map((f) => f.design.id), [favorites]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(allIds));

  useEffect(() => {
    setSelected(new Set(allIds));
  }, [allIds]);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedCount = selected.size;

  return (
    <form action={action} className="card-premium space-y-4 p-4">
      <input type="hidden" name="shopId" value={shopId} />

      <div>
        <div className="flex items-center gap-2 text-brand-green">
          <IndianRupee className="h-5 w-5" />
          <h2 className="text-lg font-bold">{t(locale, "priceQuoteFromFavorites")}</h2>
        </div>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "priceQuoteFromFavoritesHint")}</p>
        <p className="mt-1 text-xs font-semibold text-brand-green">{shopName}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-green">
          {t(locale, "selectedFavorites")} ({selectedCount}/{favorites.length})
        </p>
        {[...selected].map((id) => (
          <input key={id} type="hidden" name="designId" value={id} />
        ))}
        <div className="grid gap-2 sm:grid-cols-2">
          {favorites.map((fav) => {
            const checked = selected.has(fav.design.id);
            return (
              <label
                key={fav.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${
                  checked
                    ? "border-brand-green bg-brand-cream/80 ring-1 ring-brand-green/25"
                    : "border-zinc-200 bg-white opacity-75"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(fav.design.id)}
                  className="h-4 w-4 shrink-0 accent-brand-green"
                />
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={fav.design.imagePath}
                    alt={fav.design.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-brand-green">
                    {fav.design.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {t(locale, categoryLabelKey(fav.category))}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {selectedCount === 0 && (
          <p className="mt-2 text-xs text-amber-700">{t(locale, "selectFavoriteForQuote")}</p>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-brand-green">{t(locale, "optionalOwnPhoto")}</p>
        <FormPhotoAdd locale={locale} name="customerImage" />
      </div>

      <textarea
        name="notes"
        placeholder={t(locale, "askPriceNotesPlaceholder")}
        rows={3}
        className="input-premium w-full text-sm"
      />

      {state.error && (
        <p className="text-xs text-red-600">
          {(() => {
            const msg = t(locale, state.error);
            return msg !== state.error ? msg : state.error;
          })()}
        </p>
      )}
      {state.ok && (
        <p className="flex items-center gap-1 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {t(locale, state.message === "priceRequestsSent" ? "priceRequestsSent" : "priceRequestSent")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || selectedCount === 0}
        className="btn-primary w-full text-sm disabled:opacity-60"
      >
        {pending ? "..." : t(locale, "sendPriceQuoteToShop")}
      </button>
    </form>
  );
}
