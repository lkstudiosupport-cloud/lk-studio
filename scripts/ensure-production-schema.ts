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

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WorkPartnerProfile" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "phoneNormalized" TEXT NOT NULL,
      "city" TEXT,
      "address" TEXT,
      "locationLink" TEXT,
      "yearsExperience" INTEGER NOT NULL DEFAULT 0,
      "ratingSum" INTEGER NOT NULL DEFAULT 0,
      "ratingCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WorkPartnerProfile_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "WorkPartnerProfile_phoneNormalized_key" ON "WorkPartnerProfile"("phoneNormalized");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WorkPartnerProfile_city_idx" ON "WorkPartnerProfile"("city");`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "WorkerPartnerRequest" ADD COLUMN IF NOT EXISTS "acceptedPartnerId" TEXT;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "WorkerPartnerRequest" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);`
  );
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "WorkerPartnerRequest"
        ADD CONSTRAINT "WorkerPartnerRequest_acceptedPartnerId_fkey"
        FOREIGN KEY ("acceptedPartnerId") REFERENCES "WorkPartnerProfile"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WorkerPartnerRequest_acceptedPartnerId_idx" ON "WorkerPartnerRequest"("acceptedPartnerId");`
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WorkPartnerRating" (
      "id" TEXT NOT NULL,
      "partnerId" TEXT NOT NULL,
      "shopId" TEXT NOT NULL,
      "requestId" TEXT NOT NULL,
      "rating" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WorkPartnerRating_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "WorkPartnerRating_partnerId_fkey"
        FOREIGN KEY ("partnerId") REFERENCES "WorkPartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "WorkPartnerRating_shopId_fkey"
        FOREIGN KEY ("shopId") REFERENCES "ShopProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "WorkPartnerRating_requestId_fkey"
        FOREIGN KEY ("requestId") REFERENCES "WorkerPartnerRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "WorkPartnerRating_requestId_key" ON "WorkPartnerRating"("requestId");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "WorkPartnerRating_shopId_requestId_key" ON "WorkPartnerRating"("shopId", "requestId");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WorkPartnerRating_partnerId_idx" ON "WorkPartnerRating"("partnerId");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WorkPartnerRating_shopId_idx" ON "WorkPartnerRating"("shopId");`
  );

  console.log("[lk-studio] production schema OK (User + ShopProfile + WorkerPartnerRequest + WorkPartnerProfile)");
}

main()
  .catch((err) => {
    console.error("[lk-studio] production schema ensure failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
