/**
 * Remove all LK Studio admin catalog designs and their stored photos.
 * Shop-owned stitched designs are not touched.
 *
 * Usage: CONFIRM=yes npm run db:clear-catalog
 */
import { PrismaClient } from "@prisma/client";
import { CATALOG_CATEGORIES } from "../src/lib/design-access";
import { deleteStoredUpload } from "../src/lib/storage";

const prisma = new PrismaClient();

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
      // ignore bad JSON
    }
  }
  return [...paths];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const designs = await prisma.design.findMany({
    where: { isCatalog: true, category: { in: CATALOG_CATEGORIES } },
    select: { id: true, catalogNumber: true, imagePath: true, imagesJson: true },
  });

  if (designs.length === 0) {
    console.log("No catalog designs to remove.");
    return;
  }

  if (process.env.CONFIRM !== "yes") {
    console.log(`Found ${designs.length} catalog design(s).`);
    console.log("Run with CONFIRM=yes to delete all catalog designs and their photos.");
    process.exit(0);
  }

  console.log(`Removing ${designs.length} catalog design(s)…`);

  const ids = designs.map((d) => d.id);
  const unlinked = await prisma.order.updateMany({
    where: { designId: { in: ids } },
    data: { designId: null },
  });
  if (unlinked.count > 0) {
    console.log(`  Cleared design link on ${unlinked.count} order(s).`);
  }

  let filesRemoved = 0;
  for (const design of designs) {
    const paths = designStoragePaths(design);
    await Promise.all(paths.map((p) => deleteStoredUpload(p)));
    filesRemoved += paths.length;
  }

  const deleted = await prisma.design.deleteMany({
    where: { id: { in: ids } },
  });

  console.log("");
  console.log(`Done. Removed ${deleted.count} catalog design(s), ${filesRemoved} stored photo(s).`);
  console.log("Re-upload from Admin → Designs when ready.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
