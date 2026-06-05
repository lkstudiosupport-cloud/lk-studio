"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isCustomerActive,
  extendSubscriptionEnd,
} from "@/lib/subscription";

async function customerSession() {
  const session = await requireSession(["CUSTOMER"]);
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function assertCustomerSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true, subscriptionEndsAt: true },
  });
  if (!user || !isCustomerActive(user.subscriptionStatus, user.subscriptionEndsAt)) {
    throw new Error("Your subscription expired — renew in Profile (₹100/month)");
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
