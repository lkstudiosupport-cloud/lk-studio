import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { razorpayConfigError } from "@/lib/razorpay-config";
import type { AutopayRole } from "@/lib/subscription-autopay";
import { grantSubscriptionPeriod } from "@/lib/subscription-autopay";
import {
  isRazorpayConfigured,
  razorpayErrorMessage,
  verifyOrderPaymentSignature,
} from "@/lib/razorpay-subscription";

export async function POST(req: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { ok: false, error: razorpayConfigError() ?? "Payment is not configured" },
        { status: 503 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      role?: AutopayRole;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { role, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (role !== "SHOP") {
      return NextResponse.json(
        { ok: false, error: "Customer accounts are free — no subscription" },
        { status: 400 }
      );
    }
    if (session.role !== role) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ ok: false, error: "Missing payment details" }, { status: 400 });
    }

    const valid = verifyOrderPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const entityId = role === "SHOP" ? session.shopId : session.id;
    if (!entityId) {
      return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });
    }

    await grantSubscriptionPeriod(role, entityId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Monthly pay verify error:", err);
    return NextResponse.json(
      { ok: false, error: razorpayErrorMessage(err) },
      { status: 500 }
    );
  }
}
