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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {CATEGORIES.map((c) => (
        <Link
          key={c.key}
          href={withQueryParam(basePath, "category", c.key)}
          className={`rounded-2xl p-4 text-center shadow-md transition hover:opacity-90 ${
            c.color
          } ${active === c.key ? "ring-4 ring-brand-gold ring-offset-2" : ""}`}
        >
          <span className="text-base font-semibold">{t(locale, c.labelKey)}</span>
        </Link>
      ))}
    </div>
  );
}
