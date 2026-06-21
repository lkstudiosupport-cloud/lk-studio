import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/i18n";
import { isShopActive } from "@/lib/subscription";
import { sortByDistance, NEARBY_SHOP_RADIUS_KM } from "@/lib/geo";
import { normalizeShopCode } from "@/lib/shop-code";
import { shopRatingSummaries } from "@/lib/shop-rating";
import { cachedLocale, cachedCustomerSession } from "@/lib/cached-server";
import { ShopCodeSearch } from "@/components/ShopCodeSearch";
import { ShopBrowseCard } from "@/components/ShopBrowseCard";
import { SHOP_UPLOAD_CATEGORY } from "@/lib/design-access";

function firstPreviewByShop(
  designs: { shopId: string | null; imagePath: string; isCatalog: boolean }[],
  shopIds: string[]
) {
  const map = new Map<string, string>();
  for (const id of shopIds) map.set(id, "");
  let catalogFallback = "";
  for (const d of designs) {
    if (d.isCatalog) {
      if (!catalogFallback) catalogFallback = d.imagePath;
      for (const id of shopIds) {
        if (!map.get(id)) map.set(id, d.imagePath);
      }
    } else if (d.shopId && !map.get(d.shopId)) {
      map.set(d.shopId, d.imagePath);
    }
  }
  if (catalogFallback) {
    for (const id of shopIds) {
      if (!map.get(id)) map.set(id, catalogFallback);
    }
  }
  return map;
}

type ShopRow = {
  id: string;
  shopName: string;
  shopCode: string;
  address: string | null;
  locationLink: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  profilePhoto: string | null;
  subscriptionStatus: import("@prisma/client").SubscriptionStatus;
  subscriptionEndsAt: Date | null;
};

type ShopWithDistance = ShopRow & { distanceKm: number | null };

export default async function CustomerShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const session = await cachedCustomerSession();
  const locale = await cachedLocale();
  const params = await searchParams;
  const codeQuery = params.code?.trim() ? normalizeShopCode(params.code) : null;

  const [customer, shops, savedRows] = await Promise.all([
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
    prisma.customerSavedShop.findMany({
      where: { customerId: session!.id },
      select: { shopId: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const savedIds = new Set(savedRows.map((r) => r.shopId));
  const active = shops.filter((s) => isShopActive(s.subscriptionStatus, s.subscriptionEndsAt));

  const sorted: ShopWithDistance[] =
    customer?.latitude != null && customer?.longitude != null
      ? sortByDistance(active, customer.latitude, customer.longitude)
      : active.map((shop) => ({ ...shop, distanceKm: null as number | null }));

  const codeMatch =
    codeQuery != null
      ? await prisma.shopProfile.findUnique({
          where: { shopCode: codeQuery },
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
        })
      : null;

  const codeMatchActive =
    codeMatch && isShopActive(codeMatch.subscriptionStatus, codeMatch.subscriptionEndsAt)
      ? codeMatch
      : null;

  const codeNotFound = codeQuery != null && !codeMatch;
  const codeInactive = codeQuery != null && codeMatch && !codeMatchActive;

  const hasCustomerLocation = customer?.latitude != null && customer?.longitude != null;

  const enrichedMap = new Map(sorted.map((s) => [s.id, s]));

  const codeResultId = codeMatchActive?.id;

  const myShops = savedRows
    .map((r) => enrichedMap.get(r.shopId))
    .filter((s): s is ShopWithDistance => s != null && s.id !== codeResultId);

  const nearbyShops = hasCustomerLocation
    ? sorted.filter(
        (s) =>
          s.id !== codeResultId &&
          s.distanceKm != null &&
          s.distanceKm <= NEARBY_SHOP_RADIUS_KM &&
          !savedIds.has(s.id)
      )
    : [];

  const allOtherShops = sorted.filter(
    (s) =>
      s.id !== codeResultId &&
      !savedIds.has(s.id) &&
      !nearbyShops.some((n) => n.id === s.id)
  );

  const shopIdsForMeta = sorted.map((s) => s.id);
  if (codeMatchActive && !shopIdsForMeta.includes(codeMatchActive.id)) {
    shopIdsForMeta.push(codeMatchActive.id);
  }

  const [stitchedCountRows, previewDesigns, ratingMap] =
    shopIdsForMeta.length === 0
      ? [[], [], new Map()]
      : await Promise.all([
          prisma.design.groupBy({
            by: ["shopId"],
            where: {
              shopId: { in: shopIdsForMeta },
              category: SHOP_UPLOAD_CATEGORY,
              active: true,
              isCatalog: false,
            },
            _count: { _all: true },
          }),
          prisma.design.findMany({
            where: {
              shopId: { in: shopIdsForMeta },
              category: SHOP_UPLOAD_CATEGORY,
              active: true,
              isCatalog: false,
            },
            orderBy: { createdAt: "desc" },
            select: { shopId: true, imagePath: true, isCatalog: true },
            take: Math.min(shopIdsForMeta.length * 3, 150),
          }),
          shopRatingSummaries(shopIdsForMeta),
        ]);

  const stitchedCountMap = new Map(
    stitchedCountRows.map((r) => [r.shopId!, r._count._all])
  );
  const thumbMap = firstPreviewByShop(previewDesigns, shopIdsForMeta);

  function renderShop(shop: ShopWithDistance, showNearestBadge = false) {
    const designCount = stitchedCountMap.get(shop.id) ?? 0;
    const thumb = shop.profilePhoto || thumbMap.get(shop.id) || null;
    const rating = ratingMap.get(shop.id);

    return (
      <ShopBrowseCard
        key={shop.id}
        shop={shop}
        locale={locale}
        thumb={thumb}
        designCount={designCount}
        rating={rating}
        distanceKm={shop.distanceKm}
        isSaved={savedIds.has(shop.id)}
        showNearestBadge={showNearestBadge}
      />
    );
  }

  function enrichCodeMatch(): ShopWithDistance | null {
    if (!codeMatchActive) return null;
    const existing = enrichedMap.get(codeMatchActive.id);
    if (existing) return existing;
    if (hasCustomerLocation && customer!.latitude != null && customer!.longitude != null) {
      const [withDist] = sortByDistance([codeMatchActive], customer!.latitude, customer!.longitude);
      return withDist;
    }
    return { ...codeMatchActive, distanceKm: null };
  }

  const codeResult = enrichCodeMatch();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t(locale, "browseShops")}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {hasCustomerLocation ? t(locale, "nearestShopsHint") : t(locale, "browseShopsHint")}
        </p>
      </div>

      <ShopCodeSearch locale={locale} initialCode={params.code} />

      {codeNotFound && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t(locale, "shopCodeNotFound", { code: codeQuery! })}
        </p>
      )}

      {codeInactive && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {t(locale, "shopUnavailable")}
        </p>
      )}

      {codeResult && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-green">
            {t(locale, "shopCodeSearchResult")}
          </h2>
          {renderShop(codeResult)}
        </section>
      )}

      {!hasCustomerLocation && (
        <p className="text-xs text-zinc-500">
          {t(locale, "enableLocationForNearby")}{" "}
          <Link href="/customer/profile" className="font-semibold text-brand-green underline">
            {t(locale, "customerProfileTitle")}
          </Link>
        </p>
      )}

      {myShops.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-green">
            {t(locale, "myShops")}
          </h2>
          <p className="text-xs text-zinc-500">{t(locale, "myShopsHint")}</p>
          {myShops.map((shop) => renderShop(shop))}
        </section>
      )}

      {nearbyShops.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-green">
            {t(locale, "nearbyShops")}
          </h2>
          <p className="text-xs text-zinc-500">
            {t(locale, "nearbyShopsHint", { km: NEARBY_SHOP_RADIUS_KM })}
          </p>
          {nearbyShops.map((shop, index) => renderShop(shop, index === 0))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-green">
          {hasCustomerLocation && (myShops.length > 0 || nearbyShops.length > 0)
            ? t(locale, "allShops")
            : t(locale, "browseShops")}
        </h2>
        <p className="text-sm font-semibold text-brand-green">
          {t(locale, "activeShopsCount", { count: active.length })}
        </p>
        {allOtherShops.map((shop, index) =>
          renderShop(
            shop,
            hasCustomerLocation && myShops.length === 0 && nearbyShops.length === 0 && index === 0
          )
        )}
      </section>

      {active.length === 0 && (
        <p className="card-premium p-8 text-center text-zinc-500">{t(locale, "noShops")}</p>
      )}
    </div>
  );
}
