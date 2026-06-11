import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpayConfigError } from "@/lib/razorpay-config";
import type { AutopayRole } from "@/lib/subscription-autopay";
import { activateAutopay } from "@/lib/subscription-autopay";
import {
  isRazorpayConfigured,
  razorpayErrorMessage,
  verifySubscriptionPaymentSignature,
} from "@/lib/razorpay-subscription";

export async function POST(req: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { ok: false, error: razorpayConfigError() ?? "Autopay is not configured" },
        { status: 503 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      role?: AutopayRole;
      razorpay_payment_id?: string;
      razorpay_subscription_id?: string;
      razorpay_signature?: string;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { role, razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;
    if (role !== "SHOP" && role !== "CUSTOMER") {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }
    if (session.role !== role) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ ok: false, error: "Missing payment details" }, { status: 400 });
    }

    const valid = verifySubscriptionPaymentSignature({
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const entityId = role === "SHOP" ? session.shopId : session.id;
    if (!entityId) {
      return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });
    }

    const stored =
      role === "SHOP"
        ? await prisma.shopProfile.findUnique({
            where: { id: entityId },
            select: { razorpaySubscriptionId: true, razorpayCustomerId: true },
          })
        : await prisma.user.findUnique({
            where: { id: entityId },
            select: { razorpaySubscriptionId: true, razorpayCustomerId: true },
          });

    if (
      stored?.razorpaySubscriptionId &&
      stored.razorpaySubscriptionId !== razorpay_subscription_id
    ) {
      return NextResponse.json({ ok: false, error: "Subscription mismatch" }, { status: 400 });
    }

    await activateAutopay(role, entityId, {
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpayCustomerId: stored?.razorpayCustomerId ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Autopay verify error:", err);
    return NextResponse.json(
      { ok: false, error: razorpayErrorMessage(err) },
      { status: 500 }
    );
  }
}
