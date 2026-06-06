import type { SubscriptionStatus, UserRole } from "@prisma/client";

export const TRIAL_DAYS = 30;
/** Each paid period — same length as free trial; repeats while user keeps the app. */
export const PAID_PERIOD_DAYS = 30;
export const PLAN_PERIOD_DAYS = TRIAL_DAYS;
export const SHOP_MONTHLY_PRICE_INR = 1000;
export const CUSTOMER_MONTHLY_PRICE_INR = 100;

export function isSubscriptionActive(status: SubscriptionStatus, endsAt: Date | null) {
  if (status === "EXPIRED") return false;
  if (!endsAt) return status === "ACTIVE" || status === "TRIAL" || status === "PAST_DUE";
  return endsAt > new Date();
}

/** @deprecated use isSubscriptionActive */
export function isShopActive(status: SubscriptionStatus, endsAt: Date | null) {
  return isSubscriptionActive(status, endsAt);
}

export function isCustomerActive(status: SubscriptionStatus, endsAt: Date | null) {
  return isSubscriptionActive(status, endsAt);
}

export function trialEndDate(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d;
}

/** Extend access by one plan period (30 days) from current end, or from today if expired. */
export function extendSubscriptionEnd(currentEnd: Date | null) {
  const now = new Date();
  const base = currentEnd && currentEnd > now ? currentEnd : now;
  return trialEndDate(base);
}

export function subscriptionDaysLeft(endsAt: Date | null) {
  if (!endsAt) return 0;
  const ms = endsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Full app block — trial or paid period ended. */
export function isSubscriptionBlocked(status: SubscriptionStatus, endsAt: Date | null) {
  return !isSubscriptionActive(status, endsAt);
}

/** Payment popup/banner only when blocked (not during trial or active paid period). */
export function shouldShowPaymentPrompt(status: SubscriptionStatus, endsAt: Date | null) {
  return isSubscriptionBlocked(status, endsAt);
}

export function monthlyPriceForRole(role: UserRole) {
  return role === "SHOP" ? SHOP_MONTHLY_PRICE_INR : CUSTOMER_MONTHLY_PRICE_INR;
}

export function generateShopCode(name: string) {
  const base = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || "SHOP"}-${suffix}`;
}

export function trialDaysLeft(endsAt: Date | null) {
  return subscriptionDaysLeft(endsAt);
}

export function isInTrial(status: SubscriptionStatus, endsAt: Date | null) {
  return status === "TRIAL" && isSubscriptionActive(status, endsAt);
}
