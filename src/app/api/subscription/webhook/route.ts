import { NextResponse } from "next/server";
import type { AutopayRole } from "@/lib/subscription-autopay";
import {
  activateAutopay,
  deactivateAutopay,
  grantSubscriptionPeriod,
  markSubscriptionPastDue,
} from "@/lib/subscription-autopay";
import { verifyWebhookSignature } from "@/lib/razorpay-subscription";

type WebhookPayload = {
  event?: string;
  payload?: {
    subscription?: { entity?: { id?: string; notes?: Record<string, string> } };
    payment?: { entity?: { id?: string } };
  };
};

function notesFromPayload(payload: WebhookPayload) {
  const notes = payload.payload?.subscription?.entity?.notes ?? {};
  const role = notes.role === "SHOP" || notes.role === "CUSTOMER" ? notes.role : null;
  const entityId = notes.entityId ?? null;
  return { role: role as AutopayRole | null, entityId };
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as WebhookPayload;
  const event = payload.event ?? "";
  const { role, entityId } = notesFromPayload(payload);
  const subscriptionId = payload.payload?.subscription?.entity?.id;

  if (!role || !entityId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  switch (event) {
    case "subscription.activated":
    case "subscription.authenticated":
      if (subscriptionId) {
        await activateAutopay(role, entityId, { razorpaySubscriptionId: subscriptionId });
      } else {
        await grantSubscriptionPeriod(role, entityId);
      }
      break;
    case "subscription.charged":
      await grantSubscriptionPeriod(role, entityId);
      break;
    case "subscription.cancelled":
    case "subscription.halted":
      await deactivateAutopay(role, entityId);
      break;
    case "payment.failed":
      await markSubscriptionPastDue(role, entityId);
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
