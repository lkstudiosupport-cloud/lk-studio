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
  categories,
}: {
  locale: Locale;
  basePath: string;
  active?: ServiceCategory;
  /** When set, only these category tabs are shown (e.g. app catalog vs shop stitched). */
  categories?: ServiceCategory[];
}) {
  const tabs = categories
    ? CATEGORIES.filter((c) => categories.includes(c.key))
    : CATEGORIES;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tabs.map((c) => (
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
