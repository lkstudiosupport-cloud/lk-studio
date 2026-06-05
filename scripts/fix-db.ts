import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateShopCode(name: string) {
  const base = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return `${base || "SHOP"}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function main() {
  type Col = { name: string };
  const cols = await prisma.$queryRaw<Col[]>`PRAGMA table_info(ShopProfile)`;
  const names = new Set(cols.map((c) => c.name));

  if (!names.has("shopCode")) {
    console.log("Adding shopCode column...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "ShopProfile" ADD COLUMN "shopCode" TEXT`);
  }

  type ShopRow = { id: string; shopName: string; shopCode: string | null };
  const shops = await prisma.$queryRaw<ShopRow[]>`SELECT id, shopName, shopCode FROM ShopProfile`;

  for (const shop of shops) {
    if (!shop.shopCode) {
      const code = generateShopCode(shop.shopName);
      await prisma.$executeRawUnsafe(
        `UPDATE "ShopProfile" SET "shopCode" = ? WHERE id = ?`,
        code,
        shop.id
      );
      console.log(`Backfilled shopCode for ${shop.shopName}: ${code}`);
    }
  }

  console.log("Running prisma db push...");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
