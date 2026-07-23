import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpayConfigError } from "@/lib/razorpay-config";
import type { AutopayRole } from "@/lib/subscription-autopay";
import { isInTrial, resolveSubscriptionEndsAt } from "@/lib/subscription";
import {
  createRazorpayCustomer,
  createRazorpaySubscription,
  ensureRazorpayPlan,
  isRazorpayConfigured,
  razorpayErrorMessage,
  razorpayKeyId,
} from "@/lib/razorpay-subscription";
import { formatRazorpayContact } from "@/lib/razorpay-checkout";

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
      accountCreatedAt: shop.createdAt,
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
    accountCreatedAt: user.createdAt,
  };
}

export async function POST(req: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { ok: false, error: razorpayConfigError() ?? "Autopay is not configured on the server" },
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

    if (payer.existingSubscriptionId) {
      return NextResponse.json({
        ok: true,
        keyId: razorpayKeyId(),
        subscriptionId: payer.existingSubscriptionId,
        customerId: payer.existingCustomerId ?? undefined,
        payerEmail: payer.email,
        payerContact: formatRazorpayContact(payer.contact),
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
    const trialEnd = resolveSubscriptionEndsAt(
      payer.subscriptionStatus,
      payer.subscriptionEndsAt,
      payer.accountCreatedAt
    );
    const trialBillingStart =
      isInTrial(payer.subscriptionStatus, payer.subscriptionEndsAt, payer.accountCreatedAt) &&
      trialEnd &&
      trialEnd > new Date()
        ? trialEnd
        : null;

    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: "Could not create payment customer" },
        { status: 500 }
      );
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
      ok: true,
      keyId: razorpayKeyId(),
      subscriptionId: subscription.id,
      customerId,
      payerEmail: payer.email,
      payerContact: formatRazorpayContact(payer.contact),
      trialActive: Boolean(trialBillingStart),
      billingStartsAt: trialBillingStart?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("Autopay start error:", err);
    return NextResponse.json(
      { ok: false, error: razorpayErrorMessage(err) },
      { status: 500 }
    );
  }
}
