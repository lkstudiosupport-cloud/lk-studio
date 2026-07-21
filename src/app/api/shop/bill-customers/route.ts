import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listShopBillCustomers } from "@/lib/shop-bill-customers";

export const dynamic = "force-dynamic";

/** Light customer list for create-bill / create-order pickers. */
export async function GET() {
  try {
    const session = await requireSession(["SHOP"]);
    const shopId = session!.shopId!;
    const customers = await listShopBillCustomers(shopId);
    return NextResponse.json(
      { ok: true, customers },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch {
    return NextResponse.json({ ok: false, customers: [] }, { status: 401 });
  }
}
