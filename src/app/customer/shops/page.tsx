import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/i18n";
import { isShopActive } from "@/lib/subscription";
import { sortByDistance, formatDistanceKm } from "@/lib/geo";
import { shopRatingSummaries } from "@/lib/shop-rating";
import { cachedLocale, cachedCustomerSession } from "@/lib/cached-server";
import { ShopRatingBadge } from "@/components/ShopRatingBadge";
import { Store, MapPin, Images, Navigation, ChevronRight } from "lucide-react";

function firstPreviewByShop(
  designs: { shopId: string; imagePath: string }[],
  shopIds: string[]
) {
  const map = new Map<string, string>();
  for (const id of shopIds) map.set(id, "");
  for (const d of designs) {
    if (!map.get(d.shopId)) map.set(d.shopId, d.imagePath);
  }
  return map;
}

export default async function CustomerShopsPage() {
  const session = await cachedCustomerSession();
  const locale = await cachedLocale();

  const [customer, shops] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session!.id },
      select: { latitude: true, longitude: true },
    }),
    prisma.shopProfile.findMany({
      select: {
        id: true,
        shopName: true,
        shopCode: true,
        address: true,
        locationLink: true,
        latitude: true,
        longitude: true,
        phone: true,
        profilePhoto: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
      orderBy: { shopName: "asc" },
    }),
  ]);

  const active = shops.filter((s) => isShopActive(s.subscriptionStatus, s.subscriptionEndsAt));

  const sorted =
    customer?.latitude != null && customer?.longitude != null
      ? sortByDistance(active, customer.latitude, customer.longitude)
      : active.map((shop) => ({ ...shop, distanceKm: null as number | null }));

  const shopIds = sorted.map((s) => s.id);

  const [countRows, previewDesigns, ratingMap] =
    shopIds.length === 0
      ? [[], [], new Map()]
      : await Promise.all([
          prisma.design.groupBy({
            by: ["shopId"],
            where: { shopId: { in: shopIds }, active: true },
            _count: { _all: true },
          }),
          prisma.design.findMany({
            where: { shopId: { in: shopIds }, active: true },
            orderBy: { createdAt: "desc" },
            select: { shopId: true, imagePath: true },
            take: Math.min(shopIds.length * 3, 150),
          }),
          shopRatingSummaries(shopIds),
        ]);

  const countMap = new Map(countRows.map((r) => [r.shopId, r._count._all]));
  const thumbMap = firstPreviewByShop(previewDesigns, shopIds);

  const hasCustomerLocation = customer?.latitude != null && customer?.longitude != null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t(locale, "browseShops")}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {hasCustomerLocation ? t(locale, "nearestShopsHint") : t(locale, "browseShopsHint")}
        </p>
      </div>

      <p className="text-sm font-semibold text-brand-green">
        {t(locale, "activeShopsCount", { count: active.length })}
      </p>

      <div className="space-y-2">
        {sorted.map((shop, index) => {
          const designCount = countMap.get(shop.id) ?? 0;
          const thumb = shop.profilePhoto || thumbMap.get(shop.id) || null;
          const distanceKm = shop.distanceKm;
          const rating = ratingMap.get(shop.id);

          return (
            <Link
              key={shop.id}
              href={`/customer/designs?shopId=${shop.id}`}
              prefetch
              className="card-premium flex items-center gap-3 p-3 transition active:scale-[0.99] hover:shadow-md"
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
                  {hasCustomerLocation && index === 0 && distanceKm != null && (
                    <span className="rounded-full bg-brand-gold/30 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-green">
                      {t(locale, "nearestShop")}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-zinc-500">{shop.shopCode}</p>

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
          );
        })}
      </div>

      {active.length === 0 && (
        <p className="card-premium p-8 text-center text-zinc-500">{t(locale, "noShops")}</p>
      )}
    </div>
  );
}
