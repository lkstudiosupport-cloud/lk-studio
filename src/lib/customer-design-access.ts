import type { SubscriptionStatus } from "@prisma/client";
import { isDemoAccountUser } from "@/lib/demo-accounts";
import { isCustomerActive } from "@/lib/subscription";

export type CustomerDesignAccessUser = {
  phone?: string | null;
  phoneNormalized?: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date | null;
  createdAt?: Date | null;
};

/** Designs, favorites, and price quotes require an active customer subscription (demo accounts exempt). */
export function hasCustomerDesignAccess(user: CustomerDesignAccessUser | null | undefined): boolean {
  if (!user) return false;
  if (isDemoAccountUser(user)) return true;
  return isCustomerActive(user.subscriptionStatus, user.subscriptionEndsAt, user.createdAt);
}
