/**
 * Remove auto-generated maggam placeholder designs (SVG blouses from db:seed-maggam).
 * Keeps admin-uploaded catalog photos (uploads/catalog/...).
 *
 * Preview:  npm run catalog:remove-seed-maggam
 * Delete:    CONFIRM=yes npm run catalog:remove-seed-maggam
 */
import { PrismaClient } from "@prisma/client";
import { isSeedMaggamPlaceholderImagePath } from "../src/lib/seed-maggam-placeholder";
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
      // ignore
    }
  }
  return [...paths];
}

async function main() {
  const designs = await prisma.design.findMany({
    where: { isCatalog: true, category: "MAGGAM", active: true },
    select: { id: true, catalogNumber: true, imagePath: true, imagesJson: true, sizeTier: true },
  });

  const placeholders = designs.filter((d) => isSeedMaggamPlaceholderImagePath(d.imagePath));
  const adminDesigns = designs.filter((d) => !isSeedMaggamPlaceholderImagePath(d.imagePath));

  console.log(`Maggam catalog: ${designs.length} total`);
  console.log(`  Admin uploads (kept): ${adminDesigns.length}`);
  console.log(`  Seed placeholders (remove): ${placeholders.length}`);

  if (placeholders.length === 0) {
    console.log("\nNo seed placeholders found.");
    return;
  }

  if (process.env.CONFIRM !== "yes") {
    console.log("\nSample placeholders to remove:");
    for (const d of placeholders.slice(0, 5)) {
      console.log(`  ${d.catalogNumber ?? d.id} — ${d.imagePath}`);
    }
    console.log("\nRun with CONFIRM=yes to delete seed placeholders only.");
    return;
  }

  const ids = placeholders.map((d) => d.id);

  const unlinked = await prisma.order.updateMany({
    where: { designId: { in: ids } },
    data: { designId: null },
  });
  if (unlinked.count > 0) {
    console.log(`Cleared design link on ${unlinked.count} order(s).`);
  }

  await prisma.customerFavorite.deleteMany({ where: { designId: { in: ids } } });
  await prisma.priceRequest.deleteMany({ where: { designId: { in: ids } } });

  let filesRemoved = 0;
  for (const design of placeholders) {
    const paths = designStoragePaths(design);
    await Promise.all(paths.map((p) => deleteStoredUpload(p)));
    filesRemoved += paths.length;
  }

  const deleted = await prisma.design.deleteMany({ where: { id: { in: ids } } });

  const unassigned = adminDesigns.filter((d) => !d.sizeTier).length;
  console.log(`\nRemoved ${deleted.count} placeholder design(s), ${filesRemoved} file(s).`);
  console.log(`${adminDesigns.length} admin design(s) remain (${unassigned} unassigned — assign in Admin → Designs).`);
  if (unassigned > 0) {
    console.log("Run: npm run catalog:assign-unassigned -- --category=maggam --tier=small");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
