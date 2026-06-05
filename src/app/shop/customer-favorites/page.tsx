import { prisma } from "@/lib/prisma";
import { t } from "@/lib/i18n";
import { ShopCustomerFavoritesPanel } from "@/components/ShopCustomerFavoritesPanel";
import { cachedLocale, cachedShopSession } from "@/lib/cached-server";
import Link from "next/link";

export default async function ShopCustomerFavoritesPage() {
  const session = await cachedShopSession();
  const locale = await cachedLocale();
  const shopId = session!.shopId!;

  const favorites = await prisma.customerFavorite.findMany({
    where: { shopId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      design: { select: { id: true, title: true, imagePath: true } },
    },
    orderBy: [{ customer: { name: "asc" } }, { category: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/shop/orders" className="text-sm text-brand-green underline">
            ← {t(locale, "orders")}
          </Link>
          <h1 className="page-title mt-2">{t(locale, "customerFavoritesTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t(locale, "customerFavoritesHint")}</p>
        </div>
      </div>

      <ShopCustomerFavoritesPanel locale={locale} favorites={favorites} />
    </div>
  );
}
