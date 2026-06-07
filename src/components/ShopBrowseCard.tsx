import Link from "next/link";
import Image from "next/image";
import { Store, MapPin, Images, Navigation, ChevronRight } from "lucide-react";
import { SaveShopButton } from "@/components/SaveShopButton";
import { ShopRatingBadge } from "@/components/ShopRatingBadge";
import { formatDistanceKm } from "@/lib/geo";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";

type ShopBrowseCardProps = {
  shop: {
    id: string;
    shopName: string;
    shopCode: string;
    address: string | null;
    profilePhoto: string | null;
  };
  locale: Locale;
  thumb: string | null;
  designCount: number;
  rating?: { average: number; count: number };
  distanceKm: number | null;
  isSaved: boolean;
  showNearestBadge?: boolean;
};

export function ShopBrowseCard({
  shop,
  locale,
  thumb,
  designCount,
  rating,
  distanceKm,
  isSaved,
  showNearestBadge,
}: ShopBrowseCardProps) {
  return (
    <div className="card-premium flex items-center gap-2 p-3 transition hover:shadow-md">
      <Link
        href={`/customer/designs?shopId=${shop.id}`}
        prefetch
        className="flex min-w-0 flex-1 items-center gap-3 active:scale-[0.99]"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-brand-green/15 bg-brand-cream">
          {thumb ? (
            <Image
              src={thumb}
              alt={shop.shopName}
              fill
              className="object-cover"
              sizes="56px"
              unoptimized={thumb.endsWith(".svg")}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-brand-green">
              <Store className="h-6 w-6" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-brand-green">{shop.shopName}</p>
            {showNearestBadge && distanceKm != null && (
              <span className="rounded-full bg-brand-gold/30 px-2 py-0.5 text-xs font-bold uppercase text-brand-green">
                {t(locale, "nearestShop")}
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-zinc-500">{shop.shopCode}</p>

          <div className="mt-0.5">
            <ShopRatingBadge
              locale={locale}
              average={rating?.average ?? 0}
              count={rating?.count ?? 0}
              compact
            />
          </div>

          {shop.address ? (
            <p className="mt-1 flex items-start gap-1 text-xs text-zinc-600">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-brand-green" />
              <span className="line-clamp-2">{shop.address}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">{t(locale, "shopLocationNotSet")}</p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-brand-green-soft">
            {distanceKm != null && (
              <span className="inline-flex items-center gap-0.5 text-brand-gold-dark">
                <Navigation className="h-3 w-3" />
                {formatDistanceKm(distanceKm, locale)}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Images className="h-3 w-3" />
              {designCount} {t(locale, "shopCollectionCount")}
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-brand-gold-dark" aria-hidden />
      </Link>

      <SaveShopButton shopId={shop.id} isSaved={isSaved} locale={locale} compact />
    </div>
  );
}
