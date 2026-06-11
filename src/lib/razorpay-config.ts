import type { UserRole } from "@prisma/client";
import { CUSTOMER_MONTHLY_PRICE_INR, SHOP_MONTHLY_PRICE_INR } from "@/lib/subscription";

export function isRazorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()
  );
}

/** Human-readable reason when live Razorpay autopay cannot run (null if configured). */
export function razorpayConfigError(): string | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (keyId && keySecret) return null;
  if (keyId && !keySecret) {
    return "RAZORPAY_KEY_SECRET is not set on the server — add it in Render environment variables";
  }
  if (!keyId && keySecret) {
    return "RAZORPAY_KEY_ID is not set on the server — add it in Render environment variables";
  }
  return "Autopay is not configured on the server";
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

export function razorpayPlanId(role: UserRole) {
  return role === "SHOP"
    ? process.env.RAZORPAY_PLAN_ID_SHOP
    : process.env.RAZORPAY_PLAN_ID_CUSTOMER;
}

export function subscriptionAmountPaise(role: UserRole) {
  const inr = role === "SHOP" ? SHOP_MONTHLY_PRICE_INR : CUSTOMER_MONTHLY_PRICE_INR;
  return inr * 100;
}

export function subscriptionPlanName(role: UserRole) {
  return role === "SHOP" ? "LK Studio Shop Monthly" : "LK Studio Customer Monthly";
}
