import Razorpay from "razorpay";
import crypto from "crypto";
import type { UserRole } from "@prisma/client";
import {
  isRazorpayConfigured,
  razorpayKeyId,
  razorpayPlanId,
  subscriptionAmountPaise,
  subscriptionPlanName,
} from "@/lib/razorpay-config";

function client() {
  if (!isRazorpayConfigured()) throw new Error("Razorpay is not configured");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function ensureRazorpayPlan(role: UserRole) {
  const existing = razorpayPlanId(role);
  if (existing) return existing;

  const rz = client();
  const plan = await rz.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: subscriptionPlanName(role),
      amount: subscriptionAmountPaise(role),
      currency: "INR",
    },
  });
  return plan.id;
}

export async function createRazorpayCustomer(input: {
  name: string;
  email: string;
  contact?: string | null;
}) {
  const rz = client();
  const customer = await rz.customers.create({
    name: input.name,
    email: input.email,
    contact: input.contact ?? undefined,
    fail_existing: 0,
  });
  return customer.id;
}

export async function createRazorpaySubscription(input: {
  role: UserRole;
  planId: string;
  customerId: string;
  notes: Record<string, string>;
  startAt?: Date | null;
}): Promise<{ id: string }> {
  const rz = client();
  const startAtUnix =
    input.startAt && input.startAt.getTime() > Date.now()
      ? Math.floor(input.startAt.getTime() / 1000)
      : undefined;

  const subscription = await rz.subscriptions.create({
    plan_id: input.planId,
    customer_id: input.customerId,
    total_count: 120,
    customer_notify: 1,
    notes: input.notes,
    ...(startAtUnix ? { start_at: startAtUnix } : {}),
  } as Parameters<typeof rz.subscriptions.create>[0]);
  return subscription as { id: string };
}

export async function cancelRazorpaySubscription(subscriptionId: string) {
  const rz = client();
  await rz.subscriptions.cancel(subscriptionId, false);
}

export function verifySubscriptionPaymentSignature(input: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${input.paymentId}|${input.subscriptionId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === input.signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export { razorpayKeyId, isRazorpayConfigured };
