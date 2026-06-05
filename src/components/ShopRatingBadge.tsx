import { Star } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function ShopRatingBadge({
  average,
  count,
  locale,
  compact,
}: {
  average: number;
  count: number;
  locale: Locale;
  compact?: boolean;
}) {
  if (count <= 0) {
    return (
      <span className="text-[11px] font-medium text-zinc-400">{t(locale, "noRatingsYet")}</span>
    );
  }

  const rounded = Math.round(average * 10) / 10;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="inline-flex items-center gap-px" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(average)
                ? "fill-brand-gold text-brand-gold"
                : "fill-zinc-200 text-zinc-200"
            }`}
          />
        ))}
      </span>
      <span className={`font-semibold text-brand-gold-dark ${compact ? "text-[11px]" : "text-xs"}`}>
        {rounded.toFixed(1)}
        {!compact && (
          <span className="font-normal text-zinc-500">
            {" "}
            ({count} {t(locale, "ratingCountLabel")})
          </span>
        )}
      </span>
    </span>
  );
}
