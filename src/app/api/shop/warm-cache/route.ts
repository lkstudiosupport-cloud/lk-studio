import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { warmShopTabCaches, type ShopWarmTab } from "@/lib/cached-shop-data";

const TABS = new Set<ShopWarmTab>(["dashboard", "orders", "bills", "workers", "all"]);

/** Prefetch shop tab data into server cache for faster tab switching. */
export async function GET(req: Request) {
  try {
    const session = await requireSession(["SHOP"]);
    const shopId = session?.shopId;
    if (!shopId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const url = new URL(req.url);
    const raw = (url.searchParams.get("tab") ?? "all").toLowerCase();
    const tab: ShopWarmTab = TABS.has(raw as ShopWarmTab) ? (raw as ShopWarmTab) : "all";
    await warmShopTabCaches(shopId, tab);
    return NextResponse.json(
      { ok: true, tab },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
