import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEMO_CUSTOMER_PHONE,
  DEMO_PASSWORD,
  DEMO_SHOP2_PHONE,
  DEMO_SHOP_PHONE,
} from "../src/lib/demo-accounts";
import { internalEmailForUser } from "../src/lib/internal-email";
import { trialEndDate } from "../src/lib/subscription";

const prisma = new PrismaClient();

const DEMO_SHOP_PHONES = [DEMO_SHOP_PHONE, DEMO_SHOP2_PHONE] as const;

function storedPhoneKey(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function generateShopCode(name: string) {
  const base = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return `${base || "SHOP"}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const SAMPLE_DESIGNS = [
  { title: "Maggam border blouse", category: "MAGGAM" as const, workType: "STITCHING" as const },
  { title: "Saree fall repair", category: "BLOUSE_DESIGN" as const, workType: "REPAIR" as const },
  { title: "Peacock embroidery", category: "COMPUTER_EMBROIDERY" as const, workType: "STITCHING" as const },
];

const SAMPLE_BLOUSE_MEASUREMENTS = {
  shoulder: "14",
  armHole: "16",
  chest: "36",
  waist: "30",
  blouseLen: "15",
  armLength: "22",
  sleeve: "6",
};

async function upsertShop(name: string, shopName: string, phone: string) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const normalized = storedPhoneKey(phone);
  const email = internalEmailForUser(normalized, UserRole.SHOP);
  const whatsapp = `91${normalized}`;

  const existing = await prisma.user.findFirst({
    where: { role: UserRole.SHOP, phoneNormalized: normalized },
    include: { shopProfile: true },
  });

  const subscriptionReset = {
    subscriptionStatus: "ACTIVE" as const,
    subscriptionEndsAt: trialEndDate(),
    autopayEnabled: false,
    razorpayCustomerId: null,
    razorpaySubscriptionId: null,
  };

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        passwordHash: hash,
        name,
        phone,
        phoneNormalized: normalized,
        whatsapp,
        sessionVersion: { increment: 1 },
        autopayEnabled: false,
        razorpayCustomerId: null,
        razorpaySubscriptionId: null,
        shopProfile: existing.shopProfile
          ? { update: { shopName, phone, whatsapp, ...subscriptionReset } }
          : {
              create: {
                shopName,
                shopCode: generateShopCode(shopName),
                phone,
                whatsapp: phone.replace(/\s/g, ""),
                instagram: `@${shopName.replace(/\s/g, "").toLowerCase()}`,
                upiId: `${shopName.replace(/\s/g, "").toLowerCase()}@upi`,
                address: "Main Road, Your City",
                ...subscriptionReset,
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
      name,
      phone,
      phoneNormalized: normalized,
      whatsapp,
      role: UserRole.SHOP,
      shopProfile: {
        create: {
          shopName,
          shopCode: generateShopCode(shopName),
          phone,
          whatsapp: phone.replace(/\s/g, ""),
          instagram: `@${shopName.replace(/\s/g, "").toLowerCase()}`,
          upiId: `${shopName.replace(/\s/g, "").toLowerCase()}@upi`,
          address: "Main Road, Your City",
          ...subscriptionReset,
        },
      },
    },
    include: { shopProfile: true },
  });
}

async function upsertCustomer() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const normalized = storedPhoneKey(DEMO_CUSTOMER_PHONE);
  const email = internalEmailForUser(normalized, UserRole.CUSTOMER);

  const existing = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER, phoneNormalized: normalized },
  });

  const data = {
    email,
    passwordHash: hash,
    name: "Demo Customer",
    phone: DEMO_CUSTOMER_PHONE,
    phoneNormalized: normalized,
    whatsapp: "919123456789",
    subscriptionStatus: "ACTIVE" as const,
    subscriptionEndsAt: trialEndDate(),
    autopayEnabled: false,
    razorpayCustomerId: null,
    razorpaySubscriptionId: null,
    sessionVersion: existing ? { increment: 1 } : 0,
  };

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.user.create({
    data: {
      ...data,
      role: UserRole.CUSTOMER,
      sessionVersion: 0,
    },
  });
}

async function wipeDemoData(shopProfileIds: string[], customerId: string | null) {
  const orderWhere = {
    OR: [
      ...(shopProfileIds.length ? [{ shopId: { in: shopProfileIds } }] : []),
      ...(customerId ? [{ customerId }] : []),
    ],
  };

  const orders = await prisma.order.findMany({
    where: orderWhere,
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);

  let shopRatings = 0;
  let orderFavorites = 0;
  let orderImages = 0;
  let orderBills = 0;
  let ordersDeleted = 0;

  if (orderIds.length) {
    const r1 = await prisma.shopRating.deleteMany({ where: { orderId: { in: orderIds } } });
    shopRatings = r1.count;

    const r2 = await prisma.orderFavorite.deleteMany({ where: { orderId: { in: orderIds } } });
    orderFavorites = r2.count;

    const r3 = await prisma.orderImage.deleteMany({ where: { orderId: { in: orderIds } } });
    orderImages = r3.count;

    const r4 = await prisma.bill.deleteMany({ where: { orderId: { in: orderIds } } });
    orderBills = r4.count;

    const r5 = await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    ordersDeleted = r5.count;
  }

  const shopBillWhere = shopProfileIds.length
    ? { shopId: { in: shopProfileIds } }
    : undefined;
  const customerBillWhere = customerId ? { customerId } : undefined;

  let shopBills = 0;
  if (shopBillWhere) {
    shopBills = (await prisma.bill.deleteMany({ where: shopBillWhere })).count;
  }
  let customerBills = 0;
  if (customerBillWhere) {
    customerBills = (await prisma.bill.deleteMany({ where: customerBillWhere })).count;
  }

  const priceRequestWhere = {
    OR: [
      ...(shopProfileIds.length ? [{ shopId: { in: shopProfileIds } }] : []),
      ...(customerId ? [{ customerId }] : []),
    ],
  };
  const priceRequests =
    priceRequestWhere.OR.length > 0
      ? (await prisma.priceRequest.deleteMany({ where: priceRequestWhere })).count
      : 0;

  const favoriteWhere = {
    OR: [
      ...(shopProfileIds.length ? [{ shopId: { in: shopProfileIds } }] : []),
      ...(customerId ? [{ customerId }] : []),
    ],
  };
  const favorites =
    favoriteWhere.OR.length > 0
      ? (await prisma.customerFavorite.deleteMany({ where: favoriteWhere })).count
      : 0;

  const savedShopWhere = {
    OR: [
      ...(shopProfileIds.length ? [{ shopId: { in: shopProfileIds } }] : []),
      ...(customerId ? [{ customerId }] : []),
    ],
  };
  const savedShops =
    savedShopWhere.OR.length > 0
      ? (await prisma.customerSavedShop.deleteMany({ where: savedShopWhere })).count
      : 0;

  let designs = 0;
  if (shopProfileIds.length) {
    designs = (await prisma.design.deleteMany({ where: { shopId: { in: shopProfileIds } } })).count;
  }

  let persons = 0;
  if (customerId) {
    persons = (await prisma.person.deleteMany({ where: { customerId } })).count;
  }

  const demoUserIds = (
    await prisma.user.findMany({
      where: { phoneNormalized: { in: [...DEMO_SHOP_PHONES, DEMO_CUSTOMER_PHONE] } },
      select: { id: true },
    })
  ).map((u) => u.id);

  let trustedDevices = 0;
  if (demoUserIds.length) {
    trustedDevices = (
      await prisma.trustedDevice.deleteMany({
        where: { userId: { in: demoUserIds } },
      })
    ).count;
  }

  return {
    shopRatings,
    orderFavorites,
    orderImages,
    orderBills,
    ordersDeleted,
    shopBills,
    customerBills,
    priceRequests,
    favorites,
    savedShops,
    designs,
    persons,
    trustedDevices,
  };
}

async function seedFreshDemoState(lkShopId: string, customerId: string) {
  for (const s of SAMPLE_DESIGNS) {
    await prisma.design.create({
      data: {
        shopId: lkShopId,
        title: s.title,
        category: s.category,
        workType: s.workType,
        imagePath: "/placeholder-design.svg",
        description: "Sample — upload your own from shop dashboard.",
      },
    });
  }

  const person = await prisma.person.create({
    data: {
      customerId,
      name: "Self",
      relation: "Self",
    },
  });

  await prisma.measurement.create({
    data: {
      personId: person.id,
      type: "BLOUSE",
      ...SAMPLE_BLOUSE_MEASUREMENTS,
    },
  });

  return { designs: SAMPLE_DESIGNS.length, persons: 1 };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set — add it to .env and retry.");
    process.exit(1);
  }

  console.log("Resetting demo accounts…");

  const existingShops = await prisma.user.findMany({
    where: { role: UserRole.SHOP, phoneNormalized: { in: [...DEMO_SHOP_PHONES] } },
    include: { shopProfile: true },
  });
  const existingCustomer = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER, phoneNormalized: storedPhoneKey(DEMO_CUSTOMER_PHONE) },
  });

  const shopProfileIds = existingShops
    .map((s) => s.shopProfile?.id)
    .filter((id): id is string => Boolean(id));

  const wiped = await wipeDemoData(shopProfileIds, existingCustomer?.id ?? null);
  console.log("Wiped transactional data:", wiped);

  const shop1 = await upsertShop("LK Studio Owner", "LK Studio", DEMO_SHOP_PHONE);
  const shop2 = await upsertShop("Royal Tailors Owner", "Royal Tailors", DEMO_SHOP2_PHONE);
  const customer = await upsertCustomer();

  const lkShopId = shop1.shopProfile!.id;
  const seeded = await seedFreshDemoState(lkShopId, customer.id);

  console.log("");
  console.log("Demo reset complete.");
  console.log(`  Re-seeded ${seeded.designs} designs on LK Studio, ${seeded.persons} person with blouse measurements.`);
  console.log("");
  console.log("Credentials (password for all: demo123):");
  console.log(`  Shop 1 (LK Studio):     ${DEMO_SHOP_PHONE}`);
  console.log(`  Shop 2 (Royal Tailors): ${DEMO_SHOP2_PHONE}`);
  console.log(`  Customer:               ${DEMO_CUSTOMER_PHONE}`);
  console.log(`  Password:               ${DEMO_PASSWORD}`);
  console.log("");
  console.log(`  LK Studio shop id: ${lkShopId}`);
  console.log(`  Royal Tailors shop id: ${shop2.shopProfile!.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
