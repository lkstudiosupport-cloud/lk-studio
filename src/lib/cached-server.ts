import { cache } from "react";
import { getLocale } from "@/lib/locale-server";
import { requireSession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/safe-db";
import type { UserRole } from "@prisma/client";

/** Dedupe locale + auth reads within the same server request (layout + page). */
export const cachedLocale = cache(getLocale);

export const cachedSession = cache(() => getSession());

export function cachedRequireSession(roles: UserRole[]) {
  return cache(() => requireSession(roles));
}

export const cachedShopSession = cache(() => requireSession(["SHOP"]));

export const cachedAdminSession = cache(() => requireSession(["ADMIN"]));

export const cachedCustomerSession = cache(() => requireSession(["CUSTOMER"]));

export const cachedShopNavProfile = cache(async (shopId: string) => {
  try {
    return await withDbRetry(() =>
      prisma.shopProfile.findUnique({
        where: { id: shopId },
        select: {
          shopName: true,
          phone: true,
          profilePhoto: true,
          autopayEnabled: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          createdAt: true,
        },
      })
    );
  } catch (err) {
    console.error("[lk-studio] shop nav profile db error:", err);
    return null;
  }
});

export const cachedCustomerNavProfile = cache(async (userId: string) => {
  try {
    return await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          phone: true,
          phoneNormalized: true,
          profilePhoto: true,
          autopayEnabled: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          createdAt: true,
        },
      })
    );
  } catch (err) {
    console.error("[lk-studio] customer nav profile db error:", err);
    return null;
  }
});

export const cachedUserDemoFields = cache(async (userId: string) => {
  try {
    return await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true, phoneNormalized: true },
      })
    );
  } catch (err) {
    console.error("[lk-studio] demo fields db error:", err);
    return null;
  }
});
