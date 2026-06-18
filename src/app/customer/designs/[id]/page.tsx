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

export default async function CustomerDesignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shopId?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const { id } = await params;
  const { shopId: shopIdParam } = await searchParams;

  const design = await prisma.design.findFirst({
    where: { id, active: true },
    include: { shop: true },
  });

  if (!design) notFound();

  const contextShopId = shopIdParam ?? design.shopId ?? null;
  if (!contextShopId) notFound();

  const shop =
    design.shop ??
    (await prisma.shopProfile.findUnique({ where: { id: contextShopId } }));

  if (!shop || !isShopActive(shop.subscriptionStatus, shop.subscriptionEndsAt)) {
    notFound();
  }

  if (!design.isCatalog && design.shopId !== contextShopId) notFound();

  const favorite = await prisma.customerFavorite.findUnique({
    where: {
      customerId_designId: { customerId: session!.id, designId: design.id },
    },
  });

  const images = parseDesignImages(design.imagesJson, design.imagePath);
  const backHref = `/customer/designs?shopId=${contextShopId}`;

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
          {shop.shopName} · {t(locale, categoryLabelKey(design.category))}
        </p>
        <div className="mt-2">
          <FavoriteButton
            designId={design.id}
            shopId={contextShopId}
            isFavorite={!!favorite}
            locale={locale}
          />
        </div>
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

      <section className="card-premium p-4">
        <AskPriceForm locale={locale} shopId={contextShopId} design={design} />
      </section>
    </div>
  );
}
