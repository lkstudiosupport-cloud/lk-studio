import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { warmShopTabCaches } from "@/lib/cached-shop-data";

/** Prefetch shop tab data into server cache for faster tab switching. */
export async function GET() {
  try {
    const session = await requireSession(["SHOP"]);
    const shopId = session?.shopId;
    if (!shopId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    await warmShopTabCaches(shopId);
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
