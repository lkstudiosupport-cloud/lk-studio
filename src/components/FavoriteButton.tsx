"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/customer/actions";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function FavoriteButton({
  designId,
  shopId,
  isFavorite,
  locale,
}: {
  designId: string;
  shopId: string;
  isFavorite: boolean;
  locale: Locale;
}) {
  const [pending, startTransition] = useTransition();
  const [favorited, setFavorited] = useState(isFavorite);

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? t(locale, "removeFromFavorites") : t(locale, "addToFavorites")}
      onClick={() => {
        startTransition(async () => {
          const next = await toggleFavorite(designId, shopId);
          setFavorited(next);
        });
      }}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
        favorited
          ? "bg-brand-gold/30 text-brand-green"
          : "bg-white/90 text-zinc-600 ring-1 ring-zinc-200 hover:text-brand-green"
      }`}
    >
      <Heart className={`h-3.5 w-3.5 ${favorited ? "fill-brand-gold text-brand-gold" : ""}`} />
      {favorited ? t(locale, "savedFavorite") : t(locale, "saveFavorite")}
    </button>
  );
}
