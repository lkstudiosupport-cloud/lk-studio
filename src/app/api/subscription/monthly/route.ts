import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpayConfigError } from "@/lib/razorpay-config";
import type { AutopayRole } from "@/lib/subscription-autopay";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  razorpayErrorMessage,
  razorpayKeyId,
} from "@/lib/razorpay-subscription";
import { formatRazorpayContact } from "@/lib/razorpay-checkout";
import { subscriptionAmountPaise } from "@/lib/razorpay-config";

async function payerForRole(role: AutopayRole, session: { id: string; email: string; shopId?: string }) {
  if (role === "SHOP") {
    const shopId = session.shopId;
    if (!shopId) return null;
    const shop = await prisma.shopProfile.findUnique({
      where: { id: shopId },
      include: { user: { select: { email: true, phone: true, name: true } } },
    });
    if (!shop) return null;
    return {
      entityId: shopId,
      name: shop.shopName,
      email: shop.user.email,
      contact: shop.phone ?? shop.whatsapp ?? shop.user.phone,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return null;
  return {
    entityId: user.id,
    name: user.name,
    email: user.email,
    contact: user.phone ?? user.whatsapp,
  };
}

export async function POST(req: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { ok: false, error: razorpayConfigError() ?? "Payment is not configured on the server" },
        { status: 503 }
      );
    }

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
      return NextResponse.json(
        { ok: false, error: "Customer accounts are free — no subscription" },
        { status: 400 }
      );
    }
    if (session.role !== role) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payer = await payerForRole(role, session);
    if (!payer) {
      return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });
    }

    const order = await createRazorpayOrder({
      role,
      notes: { role, entityId: payer.entityId, kind: "monthly" },
      receipt: `m-${payer.entityId.slice(0, 12)}-${Date.now()}`,
    });

    return NextResponse.json({
      ok: true,
      keyId: razorpayKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      amountInr: Math.round(subscriptionAmountPaise(role) / 100),
      payerEmail: payer.email,
      payerContact: formatRazorpayContact(payer.contact),
      payeeName: payer.name,
    });
  } catch (err) {
    console.error("Monthly pay start error:", err);
    return NextResponse.json(
      { ok: false, error: razorpayErrorMessage(err) },
      { status: 500 }
    );
  }
}
