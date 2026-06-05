import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { DesignCard } from "@/components/DesignCard";
import { parseDesignImages } from "@/lib/design-images";
import type { Design } from "@prisma/client";

export function ShopDesignCollections({
  locale,
  designs,
  shopId,
  renderAction,
  favoriteDesignIds,
}: {
  locale: Locale;
  designs: Design[];
  shopId: string;
  renderAction: (design: Design) => React.ReactNode;
  favoriteDesignIds?: Set<string>;
}) {
  const withDesigns = CATEGORIES.filter((c) =>
    designs.some((d) => d.category === c.key)
  );

  if (withDesigns.length === 0) {
    return (
      <p className="card-premium p-8 text-center text-zinc-500">{t(locale, "noDesignsInCategory")}</p>
    );
  }

  return (
    <div className="space-y-8">
      {withDesigns.map((cat) => {
        const items = designs.filter((d) => d.category === cat.key);
        return (
          <section key={cat.key}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-brand-green">
                {t(locale, cat.labelKey)}
              </h2>
              <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-green">
                {items.length} {t(locale, "collectionItems")}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((d) => (
                <DesignCard
                  key={d.id}
                  design={d}
                  locale={locale}
                  imageLayout="cover"
                  detailHref={`/customer/designs/${d.id}?shopId=${shopId}`}
                  photosBadge={`${parseDesignImages(d.imagesJson, d.imagePath).length} · ${t(locale, "tapToViewAllPhotos")}`}
                  shopId={shopId}
                  isFavorite={favoriteDesignIds?.has(d.id)}
                  action={renderAction(d)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
