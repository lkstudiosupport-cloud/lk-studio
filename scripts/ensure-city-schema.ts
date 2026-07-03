/**
 * Idempotent schema patches for production (Render start / manual run).
 * Safe to run multiple times — uses IF NOT EXISTS.
 *
 * Usage: npm run db:ensure-city
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "ShopProfile" ADD COLUMN IF NOT EXISTS "city" TEXT;`);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ShopProfile_city_idx" ON "ShopProfile" ("city");`
  );
  console.log("[lk-studio] city schema OK (User + ShopProfile)");
}

main()
  .catch((err) => {
    console.error("[lk-studio] city schema ensure failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
