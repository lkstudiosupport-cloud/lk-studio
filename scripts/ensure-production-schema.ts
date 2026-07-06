/**
 * Idempotent production schema patches (Render start / manual run).
 * Safe to run multiple times — uses IF NOT EXISTS.
 *
 * Usage: npm run db:ensure-schema
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "ShopProfile" ADD COLUMN IF NOT EXISTS "city" TEXT;`);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ShopProfile_city_idx" ON "ShopProfile" ("city");`
  );

  // Verify columns are readable (fails fast if schema is still broken).
  await prisma.$queryRawUnsafe(`SELECT "city", "autopayEnabled" FROM "User" LIMIT 1;`);
  await prisma.$queryRawUnsafe(
    `SELECT "city", "autopayEnabled", "subscriptionStatus" FROM "ShopProfile" LIMIT 1;`
  );

  console.log("[lk-studio] production schema OK (User + ShopProfile)");
}

main()
  .catch((err) => {
    console.error("[lk-studio] production schema ensure failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
