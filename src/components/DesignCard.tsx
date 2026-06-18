import type { Design } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import { DesignImagesView } from "@/components/DesignImagesView";
import { FavoriteButton } from "@/components/FavoriteButton";

export function DesignCard({
  design,
  locale,
  action,
  detailHref,
  imageLayout = "carousel",
  photosBadge,
  shopId,
  isFavorite,
}: {
  design: Design;
  locale: Locale;
  action?: React.ReactNode;
  detailHref?: string;
  imageLayout?: "carousel" | "grid" | "cover";
  photosBadge?: string;
  shopId?: string;
  isFavorite?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <DesignImagesView
        imagePath={design.imagePath}
        imagesJson={design.imagesJson}
        alt={design.title}
        layout={imageLayout}
        detailHref={detailHref}
        photosBadge={photosBadge}
        previewCloseLabel={t(locale, "closePreview")}
        previewLabel={t(locale, "tapToPreview")}
      />
      <div className="p-3">
        {design.catalogNumber && (
          <p className="text-xs font-bold tracking-wide text-brand-gold">{design.catalogNumber}</p>
        )}
        <p className="text-xs font-medium uppercase text-brand-green">
          {t(locale, categoryLabelKey(design.category))}
        </p>
        <h3 className="font-semibold text-zinc-900">{design.title}</h3>
        {shopId != null && (
          <div className="mt-2">
            <FavoriteButton
              designId={design.id}
              shopId={shopId}
              isFavorite={isFavorite ?? false}
              locale={locale}
            />
          </div>
        )}
        {design.description && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{design.description}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </article>
  );
}
