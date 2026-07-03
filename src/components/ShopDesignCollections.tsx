"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { DesignCard } from "@/components/DesignCard";
import { ImagePreviewLightbox } from "@/components/ImagePreviewLightbox";
import { designImageFullSrc, parseDesignImages } from "@/lib/design-images";
import type { DesignListItem } from "@/lib/design-queries";

export function ShopDesignCollections({
  locale,
  designs,
  shopId,
  renderAction,
  favoriteDesignIds,
  detailHrefForDesign,
}: {
  locale: Locale;
  designs: DesignListItem[];
  shopId?: string;
  renderAction?: (design: DesignListItem) => React.ReactNode;
  favoriteDesignIds?: Set<string>;
  detailHrefForDesign?: (design: DesignListItem) => string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const previewImages = useMemo(
    () =>
      designs.map((d) => {
        const urls = parseDesignImages(d.imagesJson, d.imagePath);
        return urls[0] ?? designImageFullSrc(d.imagePath);
      }),
    [designs]
  );

  const previewLabels = useMemo(
    () => designs.map((d) => d.catalogNumber ?? d.title),
    [designs]
  );

  if (designs.length === 0) {
    return (
      <p className="card-premium p-8 text-center text-zinc-500">{t(locale, "noDesignsInCategory")}</p>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((d, index) => (
          <DesignCard
            key={d.id}
            design={d}
            locale={locale}
            imageLayout="cover"
            detailHref={
              detailHrefForDesign?.(d) ??
              (shopId ? `/customer/designs/${d.id}?shopId=${shopId}` : `/customer/designs/${d.id}`)
            }
            photosBadge={`${parseDesignImages(d.imagesJson, d.imagePath).length} · ${t(locale, "tapToViewAllPhotos")}`}
            shopId={shopId}
            isFavorite={favoriteDesignIds?.has(d.id)}
            action={renderAction?.(d)}
            onOpenPreview={() => setLightboxIndex(index)}
          />
        ))}
      </div>

      <ImagePreviewLightbox
        images={previewImages}
        labels={previewLabels}
        alt={t(locale, "designs")}
        startIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        closeLabel={t(locale, "closePreview")}
        loop={false}
      />
    </>
  );
}
