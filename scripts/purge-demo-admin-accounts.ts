/**
 * Remove seeded demo + admin users from the database.
 * Demo phone constants in src/lib/demo-accounts.ts are kept for future local/staging use.
 *
 * Usage: npm run db:purge-demo-admin
 */
import { PrismaClient, UserRole } from "@prisma/client";
import {
  DEMO_ADMIN_PHONE,
  DEMO_CUSTOMER_PHONE,
  DEMO_SHOP2_PHONE,
  DEMO_SHOP_PHONE,
} from "../src/lib/demo-accounts";
import {
  deleteAdminAccount,
  deleteCustomerAccount,
  deleteShopAccount,
} from "../src/lib/delete-account";

const prisma = new PrismaClient();

const DEMO_PHONES = [
  DEMO_SHOP_PHONE,
  DEMO_SHOP2_PHONE,
  DEMO_CUSTOMER_PHONE,
  DEMO_ADMIN_PHONE,
];

function phoneKey(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("Purging demo and admin accounts…");

  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true, phone: true, name: true },
  });
  for (const admin of admins) {
    await deleteAdminAccount(admin.id);
    console.log(`  Removed admin: ${admin.name} (${admin.phone ?? admin.id})`);
  }

  const demoShops = await prisma.user.findMany({
    where: {
      role: UserRole.SHOP,
      phoneNormalized: { in: DEMO_PHONES.map(phoneKey) },
    },
    include: { shopProfile: { select: { id: true, shopName: true } } },
  });
  for (const shop of demoShops) {
    if (shop.shopProfile) {
      await deleteShopAccount(shop.id, shop.shopProfile.id);
      console.log(`  Removed demo shop: ${shop.shopProfile.shopName} (${shop.phone})`);
    } else {
      await prisma.user.delete({ where: { id: shop.id } });
      console.log(`  Removed demo shop user without profile: ${shop.phone}`);
    }
  }

  const demoCustomers = await prisma.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
      phoneNormalized: { in: DEMO_PHONES.map(phoneKey) },
    },
    select: { id: true, name: true, phone: true },
  });
  for (const customer of demoCustomers) {
    await deleteCustomerAccount(customer.id);
    console.log(`  Removed demo customer: ${customer.name} (${customer.phone})`);
  }

  console.log("");
  console.log("Done. Demo constants remain in code; users must register fresh.");
  console.log(`  Admins removed: ${admins.length}`);
  console.log(`  Demo shops removed: ${demoShops.length}`);
  console.log(`  Demo customers removed: ${demoCustomers.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
