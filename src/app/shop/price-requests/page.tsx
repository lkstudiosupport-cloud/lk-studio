import { prisma } from "@/lib/prisma";
import { t } from "@/lib/i18n";
import { ShopPriceRequestsPanel } from "@/components/ShopPriceRequestsPanel";
import { cachedLocale, cachedShopSession } from "@/lib/cached-server";
import Link from "next/link";

export default async function ShopPriceRequestsPage() {
  const session = await cachedShopSession();
  const locale = await cachedLocale();
  const shopId = session!.shopId!;

  const requests = await prisma.priceRequest.findMany({
    where: { shopId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      design: { select: { id: true, title: true, imagePath: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/shop/orders" className="text-sm text-brand-green underline">
          ← {t(locale, "orders")}
        </Link>
        <h1 className="page-title mt-2">{t(locale, "priceRequestsTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "priceRequestsHint")}</p>
      </div>
      <ShopPriceRequestsPanel locale={locale} requests={requests} />
    </div>
  );
}
