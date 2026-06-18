import Link from "next/link";
import { withQueryParam } from "@/lib/query-string";
import { DESIGN_SIZE_TIERS, sizeTierLabelKey } from "@/lib/design-size-tier";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { DesignSizeTier, ServiceCategory } from "@prisma/client";

export function SizeTierButtons({
  locale,
  basePath,
  category,
  active,
}: {
  locale: Locale;
  basePath: string;
  category: ServiceCategory;
  active?: DesignSizeTier;
}) {
  const categoryPath = withQueryParam(basePath, "category", category);

  return (
    <div className="flex flex-wrap gap-2">
      {DESIGN_SIZE_TIERS.map((tier) => {
        const href = withQueryParam(categoryPath, "sizeTier", tier);
        const selected = active === tier;
        return (
          <Link
            key={tier}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selected
                ? "bg-brand-gold text-brand-green ring-2 ring-brand-green ring-offset-2"
                : "bg-white text-brand-green ring-1 ring-brand-green/20 hover:bg-brand-cream"
            }`}
          >
            {t(locale, sizeTierLabelKey(tier))}
          </Link>
        );
      })}
    </div>
  );
}
