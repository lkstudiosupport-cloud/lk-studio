import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  browseApiCacheKey,
  catalogAdminWhere,
  catalogBrowseWhere,
  fetchCachedCatalogDesignPage1,
  fetchCatalogDesignPage,
  parseAdminPartView,
  parseAdminSizeView,
  parseCatalogPage,
  parseCatalogPart,
  parseSizeTier,
  shopDesignsWhere,
} from "@/lib/catalog-design-list";
import { isCatalogCategory, isShopOwnedUploadCategory, shopStitchedDesignsWhere } from "@/lib/design-access";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import type { ServiceCategory } from "@prisma/client";

const CATALOG_JSON_HEADERS = {
  "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
};

/** Paginated catalog designs — customer, shop, and admin (supports 5000+ total via pages). */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawCategory = searchParams.get("category");
  if (!rawCategory) {
    return NextResponse.json({ error: "category required" }, { status: 400 });
  }

  const category = rawCategory as ServiceCategory;
  const page = parseCatalogPage(searchParams.get("page") ?? undefined);
  const mode = searchParams.get("mode") ?? "browse";

  try {
    if (mode === "admin") {
      if (session.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!isCatalogCategory(category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }

      const sizeView = categoryHasSizeTiers(category)
        ? parseAdminSizeView(searchParams.get("sizeView") ?? undefined)
        : undefined;
      const partView = categoryHasCatalogParts(category)
        ? parseAdminPartView(searchParams.get("partView") ?? undefined)
        : undefined;

      const result =
        page === 1
          ? await fetchCachedCatalogDesignPage1(
              `admin:${category}:${sizeView ?? ""}:${partView ?? ""}`,
              catalogAdminWhere({ category, sizeView, partView })
            )
          : await fetchCatalogDesignPage({
              where: catalogAdminWhere({ category, sizeView, partView }),
              page,
            });
      return NextResponse.json(result, { headers: CATALOG_JSON_HEADERS });
    }

    if (session.role !== "SHOP" && session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sizeTier = parseSizeTier(searchParams.get("size") ?? undefined);
    const catalogPart = parseCatalogPart(searchParams.get("part") ?? undefined);

    if (isShopOwnedUploadCategory(category)) {
      const targetShopId =
        session.role === "SHOP" ? session.shopId : searchParams.get("shopId")?.trim();
      if (!targetShopId) {
        return NextResponse.json({ error: "shopId required" }, { status: 400 });
      }
      if (session.role === "SHOP" && session.shopId !== targetShopId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const where = shopStitchedDesignsWhere(targetShopId);
      const result =
        page === 1
          ? await fetchCachedCatalogDesignPage1(
              browseApiCacheKey({ category, role: session.role, shopId: targetShopId }),
              where
            )
          : await fetchCatalogDesignPage({ where, page });
      return NextResponse.json(result, { headers: CATALOG_JSON_HEADERS });
    }

    if (!isCatalogCategory(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (categoryHasSizeTiers(category) && !sizeTier) {
      return NextResponse.json({ error: "size required" }, { status: 400 });
    }
    if (categoryHasCatalogParts(category) && !catalogPart) {
      return NextResponse.json({ error: "part required" }, { status: 400 });
    }

    const browseQuery = { category, sizeTier, catalogPart };
    const where =
      session.role === "SHOP" && session.shopId
        ? shopDesignsWhere(session.shopId, browseQuery)
        : catalogBrowseWhere(browseQuery);

    const result =
      page === 1
        ? await fetchCachedCatalogDesignPage1(
            browseApiCacheKey({
              category,
              sizeTier,
              catalogPart,
              role: session.role,
              shopId: session.role === "SHOP" ? session.shopId ?? undefined : undefined,
            }),
            where
          )
        : await fetchCatalogDesignPage({ where, page });
    return NextResponse.json(result, { headers: CATALOG_JSON_HEADERS });
  } catch (err) {
    console.error("[catalog/designs]", err);
    return NextResponse.json({ error: "Could not load designs" }, { status: 503 });
  }
}
