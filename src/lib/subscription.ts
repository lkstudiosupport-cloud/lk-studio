import type { SubscriptionStatus, UserRole } from "@prisma/client";

/** Free trial length — days from signup / install. */
export const TRIAL_DAYS = 25;
/** Paid renewal period — one calendar month per billing cycle. */
export const PAID_CALENDAR_MONTHS = 1;
export const PAID_BILL_DAYS = 30;
export const PLAN_BILL_DAYS = PAID_BILL_DAYS;
export const SHOP_MONTHLY_PRICE_INR = 1000;
export const CUSTOMER_MONTHLY_PRICE_INR = 100;

/** @deprecated No upfront ₹1 mandate — trial is fully free until day {TRIAL_DAYS}. */
export const TRIAL_MANDATE_AUTH_INR = 0;

/** Add whole calendar months; Jan 31 + 1 month → Feb 28/29. */
export function addCalendarMonths(from: Date, months: number): Date {
  const result = new Date(from.getTime());
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() < day) {
    result.setDate(0);
  }
  return result;
}

export function resolveSubscriptionEndsAt(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt?: Date | null
): Date | null {
  if (status === "TRIAL" && accountCreatedAt) {
    return trialEndDate(accountCreatedAt);
  }
  return endsAt;
}

export function isSubscriptionActive(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt?: Date | null
) {
  if (status === "EXPIRED") return false;
  const effectiveEnd = resolveSubscriptionEndsAt(status, endsAt, accountCreatedAt);
  if (!effectiveEnd) return status === "ACTIVE" || status === "TRIAL" || status === "PAST_DUE";
  return effectiveEnd > new Date();
}

/** @deprecated use isSubscriptionActive */
export function isShopActive(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt?: Date | null
) {
  return isSubscriptionActive(status, endsAt, accountCreatedAt);
}

export function isCustomerActive(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt?: Date | null
) {
  return isSubscriptionActive(status, endsAt, accountCreatedAt);
}

export function canCustomerBrowseDesigns(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt?: Date | null,
  autopayEnabled = false
) {
  return hasFullAppAccess(status, endsAt, accountCreatedAt, autopayEnabled);
}

export function trialEndDate(from = new Date()) {
  const result = new Date(from.getTime());
  result.setDate(result.getDate() + TRIAL_DAYS);
  return result;
}

/** Full app during free trial, or after trial when monthly autopay mandate is active. */
export function hasFullAppAccess(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt: Date | null | undefined,
  autopayEnabled: boolean
): boolean {
  if (autopayEnabled) return true;
  return isInTrial(status, endsAt, accountCreatedAt);
}

export function canShopUseApp(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt: Date | null | undefined,
  autopayEnabled: boolean
) {
  return hasFullAppAccess(status, endsAt, accountCreatedAt, autopayEnabled);
}

/** Extend access by one calendar month from current end, or from today if expired. */
export function extendSubscriptionEnd(currentEnd: Date | null) {
  const now = new Date();
  const base = currentEnd && currentEnd > now ? currentEnd : now;
  return addCalendarMonths(base, PAID_CALENDAR_MONTHS);
}

export function subscriptionDaysLeft(
  endsAt: Date | null,
  status?: SubscriptionStatus,
  accountCreatedAt?: Date | null
) {
  const effectiveEnd =
    status != null ? resolveSubscriptionEndsAt(status, endsAt, accountCreatedAt) : endsAt;
  if (!effectiveEnd) return 0;
  const ms = effectiveEnd.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isSubscriptionBlocked(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt?: Date | null
) {
  return !isSubscriptionActive(status, endsAt, accountCreatedAt);
}

export function shouldShowPaymentPrompt(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt?: Date | null
) {
  return isSubscriptionBlocked(status, endsAt, accountCreatedAt);
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

export function trialDaysLeft(
  endsAt: Date | null,
  status?: SubscriptionStatus,
  accountCreatedAt?: Date | null
) {
  return subscriptionDaysLeft(endsAt, status, accountCreatedAt);
}

export function isInTrial(
  status: SubscriptionStatus,
  endsAt: Date | null,
  accountCreatedAt?: Date | null
) {
  return status === "TRIAL" && isSubscriptionActive(status, endsAt, accountCreatedAt);
}
