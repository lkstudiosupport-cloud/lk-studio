import type { UserRole } from "@prisma/client";
import { CUSTOMER_MONTHLY_PRICE_INR, SHOP_MONTHLY_PRICE_INR } from "@/lib/subscription";

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
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
