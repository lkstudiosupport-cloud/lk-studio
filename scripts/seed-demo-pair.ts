/** Create / reset primary demo shop + customer (password demo123). */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEMO_CUSTOMER_PHONE,
  DEMO_PASSWORD,
  DEMO_SHOP_PHONE,
} from "../src/lib/demo-accounts";
import { internalEmailForUser } from "../src/lib/internal-email";
import { generateShopCode } from "../src/lib/subscription";

const prisma = new PrismaClient();

function phoneKey(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

async function upsertShop(shopName: string, ownerName: string, phone: string) {
  const normalized = phoneKey(phone);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const email = internalEmailForUser(normalized, UserRole.SHOP);
  const whatsapp = `91${normalized}`;

  const existing = await prisma.user.findFirst({
    where: { role: UserRole.SHOP, phoneNormalized: normalized },
    include: { shopProfile: true },
  });

  const profileData = {
    shopName,
    phone,
    whatsapp,
    instagram: `@${shopName.replace(/\s/g, "").toLowerCase()}`,
    upiId: `${shopName.replace(/\s/g, "").toLowerCase()}@upi`,
    address: "Main Road, Your City",
    subscriptionStatus: "TRIAL" as const,
    subscriptionEndsAt: null,
    autopayEnabled: false,
  };

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        passwordHash: hash,
        name: ownerName,
        phone,
        phoneNormalized: normalized,
        whatsapp,
        subscriptionStatus: "TRIAL",
        subscriptionEndsAt: null,
        autopayEnabled: false,
        sessionVersion: { increment: 1 },
        shopProfile: existing.shopProfile
          ? { update: profileData }
          : {
              create: {
                ...profileData,
                shopCode: generateShopCode(shopName),
              },
            },
      },
      include: { shopProfile: true },
    });
  }

  return prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      name: ownerName,
      phone,
      phoneNormalized: normalized,
      whatsapp,
      role: UserRole.SHOP,
      subscriptionStatus: "TRIAL",
      subscriptionEndsAt: null,
      shopProfile: {
        create: {
          ...profileData,
          shopCode: generateShopCode(shopName),
        },
      },
    },
    include: { shopProfile: true },
  });
}

async function upsertCustomer(name: string, phone: string) {
  const normalized = phoneKey(phone);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const email = internalEmailForUser(normalized, UserRole.CUSTOMER);

  const existing = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER, phoneNormalized: normalized },
  });

  const data = {
    email,
    passwordHash: hash,
    name,
    phone,
    phoneNormalized: normalized,
    whatsapp: `91${normalized}`,
    subscriptionStatus: "TRIAL" as const,
    subscriptionEndsAt: null,
    autopayEnabled: false,
  };

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { ...data, sessionVersion: { increment: 1 } },
    });
  }

  return prisma.user.create({
    data: { ...data, role: UserRole.CUSTOMER },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const shop = await upsertShop("LK Studio", "LK Studio Owner", DEMO_SHOP_PHONE);
  const customer = await upsertCustomer("Demo Customer", DEMO_CUSTOMER_PHONE);

  console.log("Demo accounts ready.");
  console.log("");
  console.log("Shop login (/login/shop):");
  console.log(`  Mobile:   ${DEMO_SHOP_PHONE}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Shop id:  ${shop.shopProfile?.id ?? "—"}`);
  console.log("");
  console.log("Customer login (/login/customer):");
  console.log(`  Mobile:   ${DEMO_CUSTOMER_PHONE}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  User id:  ${customer.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
