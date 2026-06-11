import { PrismaClient } from "@prisma/client";
import { trialEndDate } from "../src/lib/subscription";

const prisma = new PrismaClient();

/** Align TRIAL end dates to one calendar month from account signup. */
async function main() {
  const trialUsers = await prisma.user.findMany({
    where: { subscriptionStatus: "TRIAL" },
    select: { id: true, createdAt: true },
  });
  for (const user of trialUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionEndsAt: trialEndDate(user.createdAt) },
    });
  }

  const trialShops = await prisma.shopProfile.findMany({
    where: { subscriptionStatus: "TRIAL" },
    select: { id: true, createdAt: true },
  });
  for (const shop of trialShops) {
    await prisma.shopProfile.update({
      where: { id: shop.id },
      data: { subscriptionEndsAt: trialEndDate(shop.createdAt) },
    });
  }

  console.log(
    `Updated trial ends: ${trialUsers.length} customers, ${trialShops.length} shops`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
