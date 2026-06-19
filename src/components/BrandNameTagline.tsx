import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

/** Localized brand name + tagline (EN / HI / TE). */
export function BrandNameTagline({
  locale,
  variant = "hero",
}: {
  locale: Locale;
  variant?: "hero" | "header" | "compact";
}) {
  const name = t(locale, "appName");
  const tagline = t(locale, "tagline");

  if (variant === "header") {
    return (
      <div className="min-w-0">
        <p className="truncate text-xs font-bold uppercase tracking-[0.1em] text-brand-gold sm:text-sm md:text-base">
          {name}
        </p>
        <p className="hidden truncate text-xs leading-snug text-white/85 min-[400px]:block sm:text-sm">{tagline}</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="text-center">
        <p className="text-base font-bold text-brand-green">{name}</p>
        <p className="mt-0.5 text-xs text-brand-green-soft">{tagline}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="brand-title text-brand-green text-2xl sm:text-3xl">{name}</p>
      <p className="mt-2 text-sm text-brand-green-soft sm:text-base">{tagline}</p>
    </div>
  );
}
