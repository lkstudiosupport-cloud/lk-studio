import Link from "next/link";
import { withQueryParam } from "@/lib/query-string";
import { CATEGORIES } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { ServiceCategory } from "@prisma/client";

export function CategoryButtons({
  locale,
  basePath,
  active,
}: {
  locale: Locale;
  basePath: string;
  active?: ServiceCategory;
}) {
  return (
    <div className="space-y-2">
      <Link
        href={basePath}
        className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold transition ${
          !active
            ? "bg-brand-green text-brand-gold ring-2 ring-brand-gold ring-offset-2"
            : "bg-brand-cream text-brand-green ring-1 ring-brand-green/15 hover:bg-brand-green/10"
        }`}
      >
        {t(locale, "allDesigns")}
      </Link>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={withQueryParam(basePath, "category", c.key)}
            className={`min-h-[4.5rem] rounded-2xl p-3 text-center text-sm font-semibold shadow-md transition hover:opacity-90 ${
              c.color
            } ${active === c.key ? "ring-4 ring-brand-gold ring-offset-2" : ""}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
