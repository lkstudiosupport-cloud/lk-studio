import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const phone = "9876543211";
  const hash = await bcrypt.hash("demo123", 10);
  const email = "partner.9876543211@users.lkstudio.app";

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hash,
      name: "Demo Tailoring Partner",
      phone,
      phoneNormalized: phone,
      whatsapp: phone,
      role: UserRole.PARTNER,
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: null,
    },
    update: {
      passwordHash: hash,
      name: "Demo Tailoring Partner",
      phone,
      phoneNormalized: phone,
      role: UserRole.PARTNER,
      subscriptionStatus: "ACTIVE",
    },
  });

  await prisma.workPartnerProfile.upsert({
    where: { phoneNormalized: phone },
    create: {
      name: "Demo Tailoring Partner",
      phone,
      phoneNormalized: phone,
      city: "Hyderabad",
      yearsExperience: 5,
    },
    update: {
      name: "Demo Tailoring Partner",
      phone,
      city: "Hyderabad",
    },
  });

  console.log("OK partner demo", user.role, phone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
