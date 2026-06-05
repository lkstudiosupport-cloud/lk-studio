import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { isShopActive } from "@/lib/subscription";
import { CustomerFavoritesPanel } from "@/components/CustomerFavoritesPanel";
import Link from "next/link";
import { t } from "@/lib/i18n";

export default async function CustomerFavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const { shopId: shopIdParam } = await searchParams;

  if (!shopIdParam) {
    return (
      <div className="card-premium space-y-3 p-8 text-center">
        <p className="text-zinc-600">{t(locale, "selectShopForFavorites")}</p>
        <Link href="/customer/shops" className="btn-primary inline-flex px-5 py-2.5 text-sm">
          {t(locale, "browseShops")}
        </Link>
      </div>
    );
  }

  const shop = await prisma.shopProfile.findUnique({ where: { id: shopIdParam } });
  if (!shop || !isShopActive(shop.subscriptionStatus, shop.subscriptionEndsAt)) {
    return (
      <div className="card-premium p-6 text-center">
        <p className="text-zinc-600">{t(locale, "shopUnavailable")}</p>
        <Link href="/customer/shops" className="mt-4 inline-block font-semibold text-brand-green underline">
          {t(locale, "browseShops")}
        </Link>
      </div>
    );
  }

  const favorites = await prisma.customerFavorite.findMany({
    where: { customerId: session!.id, shopId: shop.id },
    include: {
      design: {
        select: {
          id: true,
          title: true,
          imagePath: true,
          imagesJson: true,
          workType: true,
          category: true,
        },
      },
    },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  const favoriteDesignIds = new Set(favorites.map((f) => f.design.id));

  return (
    <CustomerFavoritesPanel
      locale={locale}
      shopId={shop.id}
      shopName={shop.shopName}
      favorites={favorites}
      favoriteDesignIds={favoriteDesignIds}
    />
  );
}
