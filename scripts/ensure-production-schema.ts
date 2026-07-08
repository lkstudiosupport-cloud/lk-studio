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

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "WorkerPartnerRole" AS ENUM (
        'MAGGAM_WORKER', 'STITCHING_WORKER', 'STITCHING_MASTER', 'OTHER'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "WorkerPartnerRequestStatus" AS ENUM ('OPEN', 'FILLED', 'CANCELLED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "WorkerPartnerDurationType" AS ENUM ('ONE_DAY', 'TWO_DAYS', 'CUSTOM_DAYS');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WorkerPartnerRequest" (
      "id" TEXT NOT NULL,
      "shopId" TEXT NOT NULL,
      "role" "WorkerPartnerRole" NOT NULL,
      "customRole" TEXT,
      "neededFrom" DATE,
      "durationType" "WorkerPartnerDurationType",
      "customDays" INTEGER,
      "notes" TEXT,
      "city" TEXT,
      "status" "WorkerPartnerRequestStatus" NOT NULL DEFAULT 'OPEN',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WorkerPartnerRequest_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "WorkerPartnerRequest_shopId_fkey"
        FOREIGN KEY ("shopId") REFERENCES "ShopProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "WorkerPartnerRequest" ADD COLUMN IF NOT EXISTS "neededFrom" DATE;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "WorkerPartnerRequest" ADD COLUMN IF NOT EXISTS "durationType" "WorkerPartnerDurationType";`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "WorkerPartnerRequest" ADD COLUMN IF NOT EXISTS "customDays" INTEGER;`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "WorkerPartnerRequest" SET "neededFrom" = CURRENT_DATE WHERE "neededFrom" IS NULL;`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "WorkerPartnerRequest" SET "durationType" = 'ONE_DAY' WHERE "durationType" IS NULL;`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WorkerPartnerRequest_shopId_createdAt_idx" ON "WorkerPartnerRequest" ("shopId", "createdAt");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WorkerPartnerRequest_status_role_city_idx" ON "WorkerPartnerRequest" ("status", "role", "city");`
  );

  console.log("[lk-studio] production schema OK (User + ShopProfile + WorkerPartnerRequest)");
}

main()
  .catch((err) => {
    console.error("[lk-studio] production schema ensure failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
