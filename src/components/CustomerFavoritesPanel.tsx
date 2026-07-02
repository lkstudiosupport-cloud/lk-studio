import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FavoritePriceQuoteForm } from "@/components/FavoritePriceQuoteForm";
import type { ServiceCategory, WorkType } from "@prisma/client";
import { parseDesignImages, designImageSrc } from "@/lib/design-images";

type FavoriteRow = {
  id: string;
  category: ServiceCategory;
  design: {
    id: string;
    title: string;
    imagePath: string;
    imagesJson: string | null;
    workType: WorkType;
    category: ServiceCategory;
  };
};

export function CustomerFavoritesPanel({
  locale,
  shopId,
  shopName,
  favorites,
  favoriteDesignIds,
}: {
  locale: Locale;
  shopId: string;
  shopName: string;
  favorites: FavoriteRow[];
  favoriteDesignIds: Set<string>;
}) {
  const withItems = CATEGORIES.filter((c) => favorites.some((f) => f.category === c.key));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/customer/designs?shopId=${shopId}`} className="text-sm text-brand-green underline">
          ← {shopName}
        </Link>
        <h1 className="page-title mt-2">{t(locale, "myFavorites")}</h1>
        <p className="text-sm text-zinc-600">{t(locale, "myFavoritesHint")}</p>
        <Link
          href={`/customer/price-requests?shopId=${shopId}`}
          className="mt-2 inline-block text-sm font-semibold text-brand-green underline"
        >
          {t(locale, "myPriceQuotes")} →
        </Link>
      </div>

      {withItems.length === 0 ? (
        <div className="card-premium space-y-3 p-8 text-center">
          <p className="text-zinc-600">{t(locale, "noFavoritesYet")}</p>
          <Link
            href={`/customer/designs?shopId=${shopId}`}
            className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-sm"
          >
            {t(locale, "browseShopDesigns")}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <FavoritePriceQuoteForm
            locale={locale}
            shopId={shopId}
            shopName={shopName}
            favorites={favorites}
          />

          {withItems.map((cat) => {
            const items = favorites.filter((f) => f.category === cat.key);
            return (
              <section key={cat.key} className="card-premium p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-brand-green">{t(locale, cat.labelKey)}</h2>
                  <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-green">
                    {items.length} {t(locale, "favoriteItems")}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((fav) => {
                    const photoCount = parseDesignImages(
                      fav.design.imagesJson,
                      fav.design.imagePath
                    ).length;
                    return (
                      <article
                        key={fav.id}
                        className="overflow-hidden rounded-xl border border-brand-green/15 bg-white"
                      >
                        <div className="flex gap-3 p-3">
                          <Link
                            href={`/customer/designs/${fav.design.id}?shopId=${shopId}`}
                            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg"
                          >
                            <Image
                              src={designImageSrc(fav.design.imagePath)}
                              alt={fav.design.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] text-white">
                              {photoCount}
                            </span>
                          </Link>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="truncate font-semibold text-brand-green">{fav.design.title}</p>
                            <FavoriteButton
                              designId={fav.design.id}
                              shopId={shopId}
                              isFavorite={favoriteDesignIds.has(fav.design.id)}
                              locale={locale}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
