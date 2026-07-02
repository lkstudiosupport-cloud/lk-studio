/**
 * Remove all catalog designs for Maggam + Computer embroidery (and their R2 photos).
 * Blouse, Dress, Children are not touched.
 *
 * Preview: npm run catalog:clear-maggam-embroidery
 * Delete:  CONFIRM=yes npm run catalog:clear-maggam-embroidery
 */
import { PrismaClient, type ServiceCategory } from "@prisma/client";
import { deleteStoredUpload } from "../src/lib/storage";
import { r2DeleteObject, r2ListKeys } from "../src/lib/r2-object";
import { remoteFileStorageConfigured } from "../src/lib/storage-backend";
import { CATEGORY_STORAGE_FOLDERS } from "../src/lib/shop-storage";

const prisma = new PrismaClient();

const TARGET_CATEGORIES: ServiceCategory[] = ["MAGGAM", "COMPUTER_EMBROIDERY"];

const R2_PREFIXES_TO_PURGE = [
  `uploads/catalog/${CATEGORY_STORAGE_FOLDERS.MAGGAM}/`,
  `uploads/catalog/${CATEGORY_STORAGE_FOLDERS.COMPUTER_EMBROIDERY}/`,
  "assets/catalog/maggam-small/",
  "assets/catalog/maggam-medium/",
  "assets/catalog/maggam-big/",
];

function designStoragePaths(design: { imagePath: string; imagesJson: string | null }): string[] {
  const paths = new Set<string>();
  const add = (p: string) => {
    if (!p || p.includes("placeholder")) return;
    paths.add(p);
  };
  add(design.imagePath);
  if (design.imagesJson) {
    try {
      const arr = JSON.parse(design.imagesJson) as unknown;
      if (Array.isArray(arr)) {
        for (const p of arr) {
          if (typeof p === "string") add(p);
        }
      }
    } catch {
      // ignore
    }
  }
  return [...paths];
}

async function purgeR2Prefixes(): Promise<number> {
  if (!remoteFileStorageConfigured()) return 0;
  let removed = 0;
  for (const prefix of R2_PREFIXES_TO_PURGE) {
    let keys: string[] = [];
    try {
      keys = await r2ListKeys(prefix);
    } catch {
      continue;
    }
    for (const key of keys) {
      try {
        await r2DeleteObject(key);
        removed++;
      } catch {
        // ignore
      }
    }
  }
  return removed;
}

async function main() {
  const designs = await prisma.design.findMany({
    where: { isCatalog: true, category: { in: TARGET_CATEGORIES } },
    select: { id: true, catalogNumber: true, category: true, imagePath: true, imagesJson: true },
  });

  const byCategory = Object.fromEntries(
    TARGET_CATEGORIES.map((c) => [c, designs.filter((d) => d.category === c).length])
  ) as Record<ServiceCategory, number>;

  console.log("Will remove catalog designs (Maggam + Computer embroidery only):");
  console.log(`  MAGGAM: ${byCategory.MAGGAM ?? 0}`);
  console.log(`  COMPUTER_EMBROIDERY: ${byCategory.COMPUTER_EMBROIDERY ?? 0}`);
  console.log(`  Total: ${designs.length}`);
  console.log("  Blouse, Dress, Children — NOT touched");

  if (designs.length === 0 && !remoteFileStorageConfigured()) {
    console.log("\nNo designs to remove.");
    return;
  }

  if (process.env.CONFIRM !== "yes") {
    console.log("\nRun with CONFIRM=yes to delete these designs and R2 photos.");
    console.log("Then re-upload from Admin → Designs and assign Small / Medium / Big.");
    return;
  }

  const ids = designs.map((d) => d.id);

  if (ids.length > 0) {
    await prisma.order.updateMany({
      where: { designId: { in: ids } },
      data: { designId: null },
    });
    await prisma.customerFavorite.deleteMany({ where: { designId: { in: ids } } });
    await prisma.priceRequest.deleteMany({ where: { designId: { in: ids } } });
    await prisma.orderFavorite.deleteMany({ where: { designId: { in: ids } } });

    let filesFromDb = 0;
    for (const design of designs) {
      const paths = designStoragePaths(design);
      await Promise.all(paths.map((p) => deleteStoredUpload(p)));
      filesFromDb += paths.length;
    }

    const deleted = await prisma.design.deleteMany({ where: { id: { in: ids } } });
    console.log(`\nRemoved ${deleted.count} design row(s), ${filesFromDb} linked file(s).`);
  }

  const purged = await purgeR2Prefixes();
  console.log(`Purged ${purged} extra file(s) from R2 maggam/embroidery folders.`);

  console.log("\nDone. Re-upload from Admin → Designs:");
  console.log("  1. Tap + and upload photos (they go to Unassigned)");
  console.log("  2. Select designs → assign Small, Medium, or Big");
  console.log("\nDo NOT run: npm run db:seed-maggam (creates fake placeholder designs)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
