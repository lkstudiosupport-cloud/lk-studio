"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { placeOrderFromFavorites } from "@/app/customer/actions";
import { initialActionState } from "@/lib/action-state";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import { WorkTypeSelect } from "./WorkTypeSelect";
import { CheckCircle2 } from "lucide-react";
import type { Person, ServiceCategory, WorkType } from "@prisma/client";

type FavoriteItem = {
  id: string;
  category: ServiceCategory;
  design: {
    id: string;
    title: string;
    imagePath: string;
    workType: WorkType;
  };
};

export function PlaceOrderFromFavoritesForm({
  locale,
  shopId,
  persons,
  favorites,
  defaultPersonId,
}: {
  locale: Locale;
  shopId: string;
  persons: Person[];
  favorites: FavoriteItem[];
  defaultPersonId?: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrderFromFavorites, initialActionState);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  if (favorites.length === 0) return null;

  return (
    <form action={action} className="card-premium space-y-4 p-4">
      <div>
        <h3 className="font-bold text-brand-green">{t(locale, "placeOrderFromFavorites")}</h3>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "placeOrderFromFavoritesHint")}</p>
      </div>

      <input type="hidden" name="shopId" value={shopId} />

      <div>
        <p className="mb-2 text-xs font-semibold text-brand-green">{t(locale, "selectFavoriteDesigns")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {favorites.map((fav) => (
            <label
              key={fav.id}
              className="cursor-pointer overflow-hidden rounded-xl border border-brand-green/15 bg-white has-[:checked]:ring-2 has-[:checked]:ring-brand-gold"
            >
              <input
                type="checkbox"
                name="designId"
                value={fav.design.id}
                defaultChecked
                className="sr-only"
              />
              <div className="relative aspect-square">
                <Image
                  src={fav.design.imagePath}
                  alt={fav.design.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-semibold text-brand-green">{fav.design.title}</p>
                <p className="text-[10px] text-zinc-500">{t(locale, categoryLabelKey(fav.category))}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <WorkTypeSelect locale={locale} defaultValue="STITCHING" />

      <select name="personId" required defaultValue={defaultPersonId} className="input-premium w-full">
        <option value="">{t(locale, "person")}</option>
        {persons.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <textarea name="notes" placeholder={t(locale, "clothHandoverNotes")} rows={2} className="input-premium w-full" />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-1 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {t(locale, "orderPlaced")}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "..." : t(locale, "giveClothAndPlaceOrder")}
      </button>
    </form>
  );
}
