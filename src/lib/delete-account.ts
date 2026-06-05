import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/** Permanently delete customer account and associated data (Play Store requirement). */
export async function deleteCustomerAccount(userId: string) {
  await prisma.$transaction(async (tx) => {
    const orderIds = (
      await tx.order.findMany({ where: { customerId: userId }, select: { id: true } })
    ).map((o) => o.id);

    if (orderIds.length > 0) {
      await tx.orderImage.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.orderFavorite.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.shopRating.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.bill.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    await tx.bill.deleteMany({ where: { customerId: userId } });
    await tx.shopRating.deleteMany({ where: { customerId: userId } });
    await tx.customerFavorite.deleteMany({ where: { customerId: userId } });
    await tx.priceRequest.deleteMany({ where: { customerId: userId } });
    await tx.person.deleteMany({ where: { customerId: userId } });

    const user = await tx.user.findUnique({ where: { id: userId }, select: { phoneNormalized: true, role: true } });
    if (user?.phoneNormalized) {
      await tx.loginOtp.deleteMany({ where: { phone: user.phoneNormalized, role: user.role } });
    }

    await tx.user.delete({ where: { id: userId } });
  });
}

/** Permanently delete shop account, shop profile, and shop-owned records. */
export async function deleteShopAccount(userId: string, shopId: string) {
  await prisma.$transaction(async (tx) => {
    const orderIds = (
      await tx.order.findMany({ where: { shopId }, select: { id: true } })
    ).map((o) => o.id);

    if (orderIds.length > 0) {
      await tx.orderImage.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.orderFavorite.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.shopRating.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.bill.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    await tx.bill.deleteMany({ where: { shopId } });
    await tx.priceRequest.deleteMany({ where: { shopId } });
    await tx.customerFavorite.deleteMany({ where: { shopId } });
    await tx.design.deleteMany({ where: { shopId } });
    await tx.shopProfile.delete({ where: { id: shopId } });

    const user = await tx.user.findUnique({ where: { id: userId }, select: { phoneNormalized: true, role: true } });
    if (user?.phoneNormalized) {
      await tx.loginOtp.deleteMany({ where: { phone: user.phoneNormalized, role: UserRole.SHOP } });
    }

    await tx.user.delete({ where: { id: userId } });
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UserRole } from "@prisma/client";
