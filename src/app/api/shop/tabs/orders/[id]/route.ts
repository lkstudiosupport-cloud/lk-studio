import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { withDbRetry } from "@/lib/safe-db";
import { loadShopOrderDetail } from "@/lib/shop-tab-queries";

export const dynamic = "force-dynamic";

/** Full order detail — loaded only when shop opens/share an order card. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["SHOP"]);
    const shopId = session?.shopId;
    if (!shopId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const order = await withDbRetry(() => loadShopOrderDetail(shopId, id));
    if (!order) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    return NextResponse.json(
      { ok: true, order },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[lk-studio] shop order detail API error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
