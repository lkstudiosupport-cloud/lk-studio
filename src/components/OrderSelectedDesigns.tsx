import Image from "next/image";
import type { Design, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";

export type SelectedDesignItem = {
  design: Pick<Design, "id" | "title" | "imagePath" | "category">;
  category: ServiceCategory;
};

export function OrderSelectedDesigns({
  items,
  locale,
  titleKey = "customerSelectedDesigns",
}: {
  items: SelectedDesignItem[];
  locale: Locale;
  titleKey?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase text-brand-green">
        {t(locale, titleKey)}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map(({ design, category }) => (
          <div
            key={design.id}
            className="overflow-hidden rounded-xl border border-brand-green/15 bg-white"
          >
            <div className="relative aspect-square">
              <Image
                src={design.imagePath}
                alt={design.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="border-t border-brand-green/10 bg-brand-cream/50 px-2 py-1.5">
              <p className="truncate text-xs font-semibold text-brand-green">{design.title}</p>
              <p className="text-xs text-zinc-500">{t(locale, categoryLabelKey(category))}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
