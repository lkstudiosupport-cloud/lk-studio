import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AutopayRole } from "@/lib/subscription-autopay";
import {
  createRazorpayCustomer,
  createRazorpaySubscription,
  ensureRazorpayPlan,
  isRazorpayConfigured,
  razorpayKeyId,
} from "@/lib/razorpay-subscription";

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
      existingCustomerId: shop.razorpayCustomerId,
      existingSubscriptionId: shop.razorpaySubscriptionId,
      subscriptionEndsAt: shop.subscriptionEndsAt,
      subscriptionStatus: shop.subscriptionStatus,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return null;
  return {
    entityId: user.id,
    name: user.name,
    email: user.email,
    contact: user.phone ?? user.whatsapp,
    existingCustomerId: user.razorpayCustomerId,
    existingSubscriptionId: user.razorpaySubscriptionId,
    subscriptionEndsAt: user.subscriptionEndsAt,
    subscriptionStatus: user.subscriptionStatus,
  };
}

export async function POST(req: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Autopay is not configured on the server" }, { status: 503 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { role?: AutopayRole };
  const role = body.role;
  if (role !== "SHOP" && role !== "CUSTOMER") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (session.role !== role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payer = await payerForRole(role, session);
  if (!payer) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (payer.existingSubscriptionId) {
    return NextResponse.json({
      keyId: razorpayKeyId(),
      subscriptionId: payer.existingSubscriptionId,
      alreadyActive: true,
    });
  }

  let customerId = payer.existingCustomerId;
  if (!customerId) {
    customerId = await createRazorpayCustomer({
      name: payer.name,
      email: payer.email,
      contact: payer.contact,
    });

    if (role === "SHOP") {
      await prisma.shopProfile.update({
        where: { id: payer.entityId },
        data: { razorpayCustomerId: customerId },
      });
    } else {
      await prisma.user.update({
        where: { id: payer.entityId },
        data: { razorpayCustomerId: customerId },
      });
    }
  }

  const planId = await ensureRazorpayPlan(role);
  const trialBillingStart =
    payer.subscriptionStatus === "TRIAL" &&
    payer.subscriptionEndsAt &&
    payer.subscriptionEndsAt > new Date()
      ? payer.subscriptionEndsAt
      : null;

  if (!customerId) {
    return NextResponse.json({ error: "Could not create payment customer" }, { status: 500 });
  }

  const subscription = await createRazorpaySubscription({
    role,
    planId,
    customerId,
    notes: {
      role,
      entityId: payer.entityId,
    },
    startAt: trialBillingStart,
  });

  if (role === "SHOP") {
    await prisma.shopProfile.update({
      where: { id: payer.entityId },
      data: { razorpaySubscriptionId: subscription.id },
    });
  } else {
    await prisma.user.update({
      where: { id: payer.entityId },
      data: { razorpaySubscriptionId: subscription.id },
    });
  }

  return NextResponse.json({
    keyId: razorpayKeyId(),
    subscriptionId: subscription.id,
  });
}
