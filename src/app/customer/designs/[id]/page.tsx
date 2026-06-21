import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import { DesignImagesView } from "@/components/DesignImagesView";
import { AskPriceForm } from "@/components/AskPriceForm";
import { FavoriteButton } from "@/components/FavoriteButton";
import { isShopActive } from "@/lib/subscription";
import { parseDesignImages } from "@/lib/design-images";
import { withQueryParam } from "@/lib/query-string";
import type { ServiceCategory } from "@prisma/client";

export default async function CustomerDesignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shopId?: string; category?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const { id } = await params;
  const { shopId: shopIdParam, category: categoryParam } = await searchParams;

  const design = await prisma.design.findFirst({
    where: { id, active: true },
    include: { shop: true },
  });

  if (!design) notFound();

  const savedShop = await prisma.customerSavedShop.findFirst({
    where: { customerId: session!.id },
    orderBy: { createdAt: "desc" },
    select: { shopId: true },
  });

  let contextShopId = shopIdParam?.trim() || savedShop?.shopId || null;

  if (design.isCatalog) {
    if (shopIdParam) {
      const shop = await prisma.shopProfile.findUnique({ where: { id: shopIdParam } });
      if (!shop || !isShopActive(shop.subscriptionStatus, shop.subscriptionEndsAt)) {
        notFound();
      }
      contextShopId = shopIdParam;
    }
  } else {
    if (!design.shopId) notFound();
    contextShopId = design.shopId;
    const shop =
      design.shop ??
      (await prisma.shopProfile.findUnique({ where: { id: design.shopId } }));
    if (!shop || !isShopActive(shop.subscriptionStatus, shop.subscriptionEndsAt)) {
      notFound();
    }
  }

  const favorite = contextShopId
    ? await prisma.customerFavorite.findUnique({
        where: {
          customerId_designId: { customerId: session!.id, designId: design.id },
        },
      })
    : null;

  const images = parseDesignImages(design.imagesJson, design.imagePath);

  const backHref = design.isCatalog
    ? categoryParam
      ? withQueryParam("/customer/designs", "category", categoryParam as ServiceCategory)
      : withQueryParam("/customer/designs", "category", design.category)
    : `/customer/designs?shopId=${contextShopId}`;

  const shopForLabel = contextShopId
    ? await prisma.shopProfile.findUnique({
        where: { id: contextShopId },
        select: { shopName: true },
      })
    : null;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <Link href={backHref} className="text-sm font-semibold text-brand-green underline">
          ← {t(locale, "backToCollections")}
        </Link>
        <h1 className="page-title mt-2">
          {design.catalogNumber ? `${design.catalogNumber} · ${design.title}` : design.title}
        </h1>
        <p className="text-sm text-zinc-600">
          {shopForLabel ? `${shopForLabel.shopName} · ` : ""}
          {t(locale, categoryLabelKey(design.category))}
        </p>
        {contextShopId && (
          <div className="mt-2">
            <FavoriteButton
              designId={design.id}
              shopId={contextShopId}
              isFavorite={!!favorite}
              locale={locale}
            />
          </div>
        )}
      </div>

      <section className="card-premium p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-green">
          {t(locale, "allDesignPhotos")} ({images.length})
        </h2>
        <DesignImagesView
          imagePath={design.imagePath}
          imagesJson={design.imagesJson}
          alt={design.title}
          layout="grid"
          previewCloseLabel={t(locale, "closePreview")}
          previewLabel={t(locale, "tapToPreview")}
        />
      </section>

      {contextShopId ? (
        <section className="card-premium p-4">
          <AskPriceForm locale={locale} shopId={contextShopId} design={design} />
        </section>
      ) : (
        <section className="card-premium p-4 text-sm text-zinc-600">
          {t(locale, "pickShopForPriceQuote")}{" "}
          <Link href="/customer/shops" className="font-semibold text-brand-green underline">
            {t(locale, "browseShops")}
          </Link>
        </section>
      )}
    </div>
  );
}
