/** Create or reset LK Studio admin user only. */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { internalEmailForUser } from "../src/lib/internal-email";

const prisma = new PrismaClient();

async function main() {
  const phone = "9000000001";
  const normalized = "9000000001";
  const hash = await bcrypt.hash("lkstudio123", 10);
  const email = internalEmailForUser(normalized, UserRole.ADMIN);

  const existing = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, phoneNormalized: normalized },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        passwordHash: hash,
        name: "LK Studio Admin",
        phone,
        phoneNormalized: normalized,
        subscriptionStatus: "ACTIVE",
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        name: "LK Studio Admin",
        phone,
        phoneNormalized: normalized,
        role: UserRole.ADMIN,
        subscriptionStatus: "ACTIVE",
      },
    });
  }

  console.log("Admin OK — login at /login/admin");
  console.log("Mobile: 9000000001 | Password: lkstudio123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
