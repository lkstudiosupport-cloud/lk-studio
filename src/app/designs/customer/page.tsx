import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { CustomerCatalogPanel } from "@/components/CustomerCatalogPanel";
import { isCatalogCategory } from "@/lib/design-access";
import { categoryHasSizeTiers, defaultSizeTierForCategory } from "@/lib/design-size-tier";
import { categoryHasCatalogParts, defaultCatalogPartForCategory } from "@/lib/design-catalog-part";
import {
  cachedAllCatalogPartCounts,
  cachedAllCatalogSizeTierCounts,
  cachedCatalogCategoryCounts,
} from "@/lib/catalog-design-counts";
import { catalogBrowseApiQuery, fetchCatalogBrowseBootstrap } from "@/lib/catalog-design-list";
import { withDbRetry } from "@/lib/safe-db";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import { ServerRetryPanel } from "@/components/ServerRetryPanel";

const BASE_PATH = "/designs/customer";

export default async function DesignsCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; size?: string; part?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  if (!session) redirect("/login/customer?app=designs");
  const locale = await getLocale();
  const params = await searchParams;

  try {
    const customer = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: session!.id },
        select: { id: true },
      })
    );
    if (!customer) {
      return (
        <div className="card-premium p-6 text-center text-sm text-zinc-600">
          {t(locale, "noData")}
        </div>
      );
    }

    const rawCategory = params.category as ServiceCategory | undefined;
    const category: ServiceCategory =
      rawCategory && isCatalogCategory(rawCategory) ? rawCategory : "MAGGAM";
    const rawSize = params.size?.toUpperCase();
    const sizeFromParams =
      rawSize === "SMALL" || rawSize === "MEDIUM" || rawSize === "BIG"
        ? (rawSize as DesignSizeTier)
        : undefined;
    const initialSizeTier = categoryHasSizeTiers(category)
      ? sizeFromParams ?? defaultSizeTierForCategory(category)
      : undefined;
    const rawPart = params.part?.toUpperCase();
    const partFromParams =
      rawPart === "MAIN" || rawPart === "HAND_SLEEVES" ? (rawPart as CatalogPart) : undefined;
    const initialCatalogPart = categoryHasCatalogParts(category)
      ? partFromParams ?? defaultCatalogPartForCategory(category)
      : undefined;

    const savedShop = await withDbRetry(() =>
      prisma.customerSavedShop.findFirst({
        where: { customerId: session!.id },
        orderBy: { createdAt: "desc" },
        select: { shopId: true },
      })
    );
    const priceShopId = savedShop?.shopId;
    const browseQuery = { category, sizeTier: initialSizeTier, catalogPart: initialCatalogPart };

    const [browseBootstrap, categoryCounts, allTierCounts, allPartCounts, customerFavorites] =
      await Promise.all([
        fetchCatalogBrowseBootstrap(browseQuery),
        cachedCatalogCategoryCounts(),
        cachedAllCatalogSizeTierCounts(),
        cachedAllCatalogPartCounts(),
        priceShopId
          ? withDbRetry(() =>
              prisma.customerFavorite.findMany({
                where: { customerId: session!.id, shopId: priceShopId },
                select: { designId: true },
              })
            )
          : Promise.resolve([]),
      ]);

    const designPage = browseBootstrap.active;

    return (
      <CustomerCatalogPanel
        locale={locale}
        designs={designPage.items}
        total={designPage.total ?? designPage.items.length}
        hasMore={designPage.hasMore}
        apiQuery={catalogBrowseApiQuery(browseQuery)}
        categoryCounts={categoryCounts}
        allTierCounts={allTierCounts}
        allPartCounts={allPartCounts}
        favoriteDesignIds={customerFavorites.map((f) => f.designId)}
        priceShopId={priceShopId}
        initialCategory={category}
        initialSizeTier={initialSizeTier}
        initialCatalogPart={initialCatalogPart}
        initialBrowseCache={browseBootstrap.cache}
        basePath={BASE_PATH}
        detailBasePath={BASE_PATH}
        hideShopPicker
      />
    );
  } catch (err) {
    console.error("[lk-studio] designs customer page error:", err);
    return <ServerRetryPanel locale={locale} />;
  }
}
