"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extendSubscriptionEnd,
} from "@/lib/subscription";
import { hasCustomerDesignAccess } from "@/lib/customer-design-access";

async function customerSession() {
  const session = await requireSession(["CUSTOMER"]);
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function assertCustomerSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      phoneNormalized: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      createdAt: true,
    },
  });
  if (!user || !hasCustomerDesignAccess(user)) {
    throw new Error("Subscribe in Profile to browse designs and ask prices");
  }
}

/** Demo: extend subscription (replace with payment gateway in production) */
export async function renewCustomerSubscription() {
  const session = await customerSession();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { subscriptionEndsAt: true },
  });
  await prisma.user.update({
    where: { id: session.id },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: extendSubscriptionEnd(user?.subscriptionEndsAt ?? null),
    },
  });
  revalidatePath("/customer", "layout");
  revalidatePath("/customer/profile");
}
