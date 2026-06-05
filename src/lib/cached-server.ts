import { cache } from "react";
import { getLocale } from "@/lib/locale-server";
import { requireSession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/** Dedupe locale + auth reads within the same server request (layout + page). */
export const cachedLocale = cache(getLocale);

export const cachedSession = cache(() => getSession());

export function cachedRequireSession(roles: UserRole[]) {
  return cache(() => requireSession(roles));
}

export const cachedShopSession = cache(() => requireSession(["SHOP"]));

export const cachedCustomerSession = cache(() => requireSession(["CUSTOMER"]));

export const cachedShopNavProfile = cache(async (shopId: string) => {
  return prisma.shopProfile.findUnique({
    where: { id: shopId },
    select: { shopName: true, profilePhoto: true, autopayEnabled: true },
  });
});

export const cachedCustomerNavProfile = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, profilePhoto: true, autopayEnabled: true },
  });
});
