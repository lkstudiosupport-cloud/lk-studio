import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AutopayRole } from "@/lib/subscription-autopay";
import { activateAutopay } from "@/lib/subscription-autopay";
import {
  isRazorpayConfigured,
  verifySubscriptionPaymentSignature,
} from "@/lib/razorpay-subscription";

export async function POST(req: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Autopay is not configured" }, { status: 503 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    role?: AutopayRole;
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  };

  const { role, razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;
  if (role !== "SHOP" && role !== "CUSTOMER") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (session.role !== role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const valid = verifySubscriptionPaymentSignature({
    paymentId: razorpay_payment_id,
    subscriptionId: razorpay_subscription_id,
    signature: razorpay_signature,
  });
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const entityId = role === "SHOP" ? session.shopId : session.id;
  if (!entityId) return NextResponse.json({ error: "Account not found" }, { status: 404 });

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

  if (stored?.razorpaySubscriptionId && stored.razorpaySubscriptionId !== razorpay_subscription_id) {
    return NextResponse.json({ error: "Subscription mismatch" }, { status: 400 });
  }

  await activateAutopay(role, entityId, {
    razorpaySubscriptionId: razorpay_subscription_id,
    razorpayCustomerId: stored?.razorpayCustomerId ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
