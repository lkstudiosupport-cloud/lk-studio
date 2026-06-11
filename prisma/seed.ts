import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { internalEmailForUser } from "../src/lib/internal-email";
import { trialEndDate } from "../src/lib/subscription";
const prisma = new PrismaClient();

function generateShopCode(name: string) {
  const base = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return `${base || "SHOP"}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function storedPhoneKey(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

async function upsertShop(
  name: string,
  shopName: string,
  phone: string
) {
  const hash = await bcrypt.hash("demo123", 10);
  const normalized = storedPhoneKey(phone);
  const email = internalEmailForUser(normalized, UserRole.SHOP);
  const whatsapp = `91${normalized}`;

  const existing = await prisma.user.findFirst({
    where: { role: UserRole.SHOP, phoneNormalized: normalized },
    include: { shopProfile: true },
  });

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
        shopProfile: existing.shopProfile
          ? { update: { shopName, phone, whatsapp } }
          : {
              create: {
                shopName,
                shopCode: generateShopCode(shopName),
                phone,
                whatsapp: phone.replace(/\s/g, ""),
                instagram: `@${shopName.replace(/\s/g, "").toLowerCase()}`,
                upiId: `${shopName.replace(/\s/g, "").toLowerCase()}@upi`,
                subscriptionStatus: "ACTIVE",
                subscriptionEndsAt: trialEndDate(),
                address: "Main Road, Your City",
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
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: trialEndDate(),
          address: "Main Road, Your City",
        },
      },
    },
    include: { shopProfile: true },
  });
}

async function main() {
  if (process.env.SKIP_DEMO_SEED === "true") {
    console.log("SKIP_DEMO_SEED=true — demo accounts not created.");
    return;
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    console.log("Production: skipping demo seed. Set ALLOW_DEMO_SEED=true only for staging.");
    return;
  }

  const shop1 = await upsertShop(
    "LK Studio Owner",
    "LK Studio",
    "9876543210"
  );

  await upsertShop(
    "Royal Tailors Owner",
    "Royal Tailors",
    "9988776655"
  );

  const customerPhone = "9123456789";
  const customerNormalized = storedPhoneKey(customerPhone);
  const customerEmail = internalEmailForUser(customerNormalized, UserRole.CUSTOMER);

  const existingCustomer = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER, phoneNormalized: customerNormalized },
  });

  if (existingCustomer) {
    await prisma.user.update({
      where: { id: existingCustomer.id },
      data: {
        email: customerEmail,
        passwordHash: await bcrypt.hash("demo123", 10),
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: trialEndDate(),
        phoneNormalized: customerNormalized,
        whatsapp: "919123456789",
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email: customerEmail,
        passwordHash: await bcrypt.hash("demo123", 10),
        name: "Demo Customer",
        phone: customerPhone,
        phoneNormalized: customerNormalized,
        whatsapp: "919123456789",
        role: UserRole.CUSTOMER,
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: trialEndDate(),
      },
    });
  }

  const shopId = shop1.shopProfile!.id;
  const samples = [
    { title: "Maggam border blouse", category: "MAGGAM" as const, workType: "STITCHING" as const },
    { title: "Saree fall repair", category: "BLOUSE_DESIGN" as const, workType: "REPAIR" as const },
    { title: "Peacock embroidery", category: "COMPUTER_EMBROIDERY" as const, workType: "STITCHING" as const },
  ];

  for (const s of samples) {
    const exists = await prisma.design.findFirst({
      where: { shopId, title: s.title },
    });
    if (!exists) {
      await prisma.design.create({
        data: {
          shopId,
          title: s.title,
          category: s.category,
          workType: s.workType,
          imagePath: "/placeholder-design.svg",
          description: "Sample — upload your own from shop dashboard.",
        },
      });
    }
  }

  console.log("Seed OK. Shop mobile: 9876543210 | Customer mobile: 9123456789 | password: demo123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
