import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { withDbRetry } from "@/lib/safe-db";
import {
  loadShopBillsTab,
  loadShopDashboardTab,
  loadShopOrdersTab,
  loadShopWorkersTab,
} from "@/lib/shop-tab-queries";
import type { ShopTabId } from "@/lib/shop-tab-types";

export const dynamic = "force-dynamic";

const TABS = new Set<ShopTabId>(["dashboard", "orders", "bills", "workers"]);

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
      switch (tab) {
        case "dashboard":
          return loadShopDashboardTab(shopId);
        case "orders":
          return loadShopOrdersTab(shopId);
        case "bills":
          return loadShopBillsTab(
            shopId,
            url.searchParams.get("billsTab") ?? url.searchParams.get("filter"),
            url.searchParams.get("mode"),
            url.searchParams.get("period")
          );
        case "workers":
          return loadShopWorkersTab(shopId);
      }
    });

    // Bills filter uses ?tab= on the page URL; API uses tab=bills&billsTab=pending
    // Support page-style params when client sends tab/mode/period for bills.
    return NextResponse.json(
      { ok: true, tab, data },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[lk-studio] shop tabs API error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
