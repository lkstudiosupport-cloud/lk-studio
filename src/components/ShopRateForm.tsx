"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { rateShopOrder } from "@/app/customer/actions";

export function ShopRateForm({
  orderId,
  shopId,
  locale,
  existingRating,
}: {
  orderId: string;
  shopId: string;
  locale: Locale;
  existingRating?: number | null;
}) {
  const [rating, setRating] = useState(existingRating ?? 0);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(existingRating != null);

  function submit(value: number) {
    setRating(value);
    startTransition(async () => {
      try {
        await rateShopOrder({ orderId, shopId, rating: value });
        setSaved(true);
      } catch {
        setSaved(false);
      }
    });
  }

  return (
    <div className="rounded-xl border border-brand-gold/30 bg-brand-cream/50 px-3 py-2">
      <p className="mb-1 text-[11px] font-semibold text-brand-green">{t(locale, "rateThisShop")}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={pending || saved}
            onClick={() => submit(star)}
            className="rounded p-0.5 disabled:opacity-60"
            aria-label={`${star} ${t(locale, "ratingStars")}`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating ? "fill-brand-gold text-brand-gold" : "text-zinc-300"
              }`}
            />
          </button>
        ))}
        {saved && (
          <span className="ml-2 text-[10px] font-medium text-emerald-700">{t(locale, "ratingSaved")}</span>
        )}
      </div>
    </div>
  );
}
