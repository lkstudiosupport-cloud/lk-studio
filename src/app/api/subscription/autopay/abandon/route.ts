import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AutopayRole } from "@/lib/subscription-autopay";

/** Clear an unfinished Razorpay subscription when the shop closes checkout without paying. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { role?: AutopayRole };
  try {
    body = (await req.json()) as { role?: AutopayRole };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const role = body.role;
  if (role !== "SHOP") {
    return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
  }
  if (session.role !== role) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const shopId = session.shopId;
  if (!shopId) {
    return NextResponse.json({ ok: false, error: "Shop not found" }, { status: 404 });
  }
  const shop = await prisma.shopProfile.findUnique({
    where: { id: shopId },
    select: { autopayEnabled: true, razorpaySubscriptionId: true },
  });
  if (shop && !shop.autopayEnabled && shop.razorpaySubscriptionId) {
    await prisma.shopProfile.update({
      where: { id: shopId },
      data: { razorpaySubscriptionId: null },
    });
  }

  return NextResponse.json({ ok: true });
}
