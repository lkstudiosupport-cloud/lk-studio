import { prisma } from "@/lib/prisma";
import { hasCustomerDesignAccess } from "@/lib/customer-design-access";

export async function customerDesignAccessForUser(userId: string) {
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
  return { user, allowed: hasCustomerDesignAccess(user) };
}
