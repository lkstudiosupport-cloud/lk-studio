import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extendSubscriptionEnd, isInTrial } from "@/lib/subscription";
import { revalidatePath } from "next/cache";

export type AutopayRole = Extract<UserRole, "SHOP" | "CUSTOMER">;

export async function getAutopayState(role: AutopayRole, entityId: string) {
  if (role === "SHOP") {
    return prisma.shopProfile.findUnique({
      where: { id: entityId },
      select: {
        autopayEnabled: true,
        razorpaySubscriptionId: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        createdAt: true,
      },
    });
  }
  return prisma.user.findUnique({
    where: { id: entityId },
    select: {
      autopayEnabled: true,
      razorpaySubscriptionId: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      createdAt: true,
    },
  });
}

export async function grantSubscriptionPeriod(role: AutopayRole, entityId: string) {
  if (role === "SHOP") {
    const shop = await prisma.shopProfile.findUnique({ where: { id: entityId } });
    if (!shop) return;
    await prisma.shopProfile.update({
      where: { id: entityId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: extendSubscriptionEnd(shop.subscriptionEndsAt),
      },
    });
    revalidateSubscriptionPaths("SHOP", entityId);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: entityId } });
  if (!user) return;
  await prisma.user.update({
    where: { id: entityId },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: extendSubscriptionEnd(user.subscriptionEndsAt),
    },
  });
  revalidateSubscriptionPaths("CUSTOMER", entityId);
}

export async function activateAutopay(
  role: AutopayRole,
  entityId: string,
  data: {
    razorpayCustomerId?: string;
    razorpaySubscriptionId: string;
  }
) {
  const patch = {
    autopayEnabled: true,
    razorpaySubscriptionId: data.razorpaySubscriptionId,
    ...(data.razorpayCustomerId ? { razorpayCustomerId: data.razorpayCustomerId } : {}),
  };

  if (role === "SHOP") {
    await prisma.shopProfile.update({ where: { id: entityId }, data: patch });
  } else {
    await prisma.user.update({ where: { id: entityId }, data: patch });
  }

  const state = await getAutopayState(role, entityId);
  const inActiveTrial =
    state != null &&
    isInTrial(state.subscriptionStatus, state.subscriptionEndsAt, state.createdAt);

  if (!inActiveTrial) {
    await grantSubscriptionPeriod(role, entityId);
  } else {
    revalidateSubscriptionPaths(role, entityId);
    revalidatePath("/register/autopay");
  }
}

export async function deactivateAutopay(role: AutopayRole, entityId: string) {
  const patch = {
    autopayEnabled: false,
    razorpaySubscriptionId: null,
  };

  if (role === "SHOP") {
    await prisma.shopProfile.update({ where: { id: entityId }, data: patch });
    revalidateSubscriptionPaths("SHOP", entityId);
  } else {
    await prisma.user.update({ where: { id: entityId }, data: patch });
    revalidateSubscriptionPaths("CUSTOMER", entityId);
  }
}

export async function markSubscriptionPastDue(role: AutopayRole, entityId: string) {
  if (role === "SHOP") {
    await prisma.shopProfile.update({
      where: { id: entityId },
      data: { subscriptionStatus: "PAST_DUE" },
    });
    revalidateSubscriptionPaths("SHOP", entityId);
  } else {
    await prisma.user.update({
      where: { id: entityId },
      data: { subscriptionStatus: "PAST_DUE" },
    });
    revalidateSubscriptionPaths("CUSTOMER", entityId);
  }
}

function revalidateSubscriptionPaths(role: AutopayRole, entityId: string) {
  if (role === "SHOP") {
    revalidatePath("/shop");
    revalidatePath("/shop/profile");
  } else {
    revalidatePath("/customer");
    revalidatePath("/customer/profile");
  }
  void entityId;
}
