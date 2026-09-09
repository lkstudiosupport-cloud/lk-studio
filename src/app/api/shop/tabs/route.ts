import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { withDbRetry } from "@/lib/safe-db";
import { unstable_cache } from "next/cache";
import { shopTabCacheTag } from "@/lib/cached-shop-data";
import {
  loadShopBillsTab,
  loadShopDashboardTab,
  loadShopOrdersTab,
  loadShopWorkersTab,
} from "@/lib/shop-tab-queries";
import type { ShopTabId } from "@/lib/shop-tab-types";

export const dynamic = "force-dynamic";

const TABS = new Set<ShopTabId>(["dashboard", "orders", "bills", "workers"]);

/** Per-shop cache so revalidateShopTabCache(shopId) actually drops tab payloads. */
async function getCachedTabData(
  shopId: string,
  tab: ShopTabId,
  billsTab: string | null,
  mode: string | null,
  period: string | null
) {
  return unstable_cache(
    async () => {
      switch (tab) {
        case "dashboard":
          return loadShopDashboardTab(shopId);
        case "orders":
          return loadShopOrdersTab(shopId);
        case "bills":
          return loadShopBillsTab(shopId, billsTab ?? undefined, mode ?? undefined, period ?? undefined);
        case "workers":
          return loadShopWorkersTab(shopId);
        default:
          return null;
      }
    },
    ["shop-tabs-api", shopId, tab, billsTab ?? "", mode ?? "", period ?? ""],
    { revalidate: 45, tags: [shopTabCacheTag(shopId)] }
  )();
}

/** Light JSON payloads for shop main tabs — used by the client tab cache. */
export async function GET(req: Request) {
  try {
    const session = await requireSession(["SHOP"]);
    const shopId = session?.shopId;
    if (!shopId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const url = new URL(req.url);
    const tabRaw = (url.searchParams.get("tab") ?? "").toLowerCase();
    if (!TABS.has(tabRaw as ShopTabId)) {
      return NextResponse.json({ ok: false, error: "Invalid tab" }, { status: 400 });
    }
    const tab = tabRaw as ShopTabId;

    const data = await withDbRetry(async () => {
      const billsTab = url.searchParams.get("billsTab") ?? url.searchParams.get("filter");
      const mode = url.searchParams.get("mode");
      const period = url.searchParams.get("period");
      return getCachedTabData(shopId, tab, billsTab, mode, period);
    });

    // Client memory cache is the UX layer; avoid a second HTTP cache that
    // survives bill payment / order mutations after clearShopTabCache().
    return NextResponse.json(
      { ok: true, tab, data },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[lk-studio] shop tabs API error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
