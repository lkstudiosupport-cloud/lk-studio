/**
 * Seeds maggam catalog images on R2 (Option B + G1).
 *
 * Default (safe): sync thumbs only — does NOT create synthetic designs.
 * Placeholders (demo only): npm run db:seed-maggam -- --placeholders
 *
 * Thumbs only:       npm run catalog:sync-maggam-thumbs
 * Remove placeholders: CONFIRM=yes npm run catalog:remove-seed-maggam
 */
import { PrismaClient, type DesignSizeTier } from "@prisma/client";
import { deleteStoredUpload, saveCatalogAsset } from "../src/lib/storage";
import { fetchStoredObject } from "../src/lib/fetch-stored-object";
import { storageKeyFromStoredUrl } from "../src/lib/storage-url";
import {
  isAdminCatalogUploadImagePath,
  isSeedMaggamPlaceholderImagePath,
} from "../src/lib/seed-maggam-placeholder";
import {
  catalogNumberFor,
  folderSlugForTier,
  maggamCatalogFullRelPath,
  maggamCatalogThumbRelPath,
  renderMaggamBlouse,
  renderMaggamBlouseThumb,
  titleForIndex,
} from "../src/lib/maggam-catalog-image";

const prisma = new PrismaClient();
const TARGET_COUNT = 100;
const FORCE = process.argv.includes("--force");
const PLACEHOLDERS = process.argv.includes("--placeholders");
const TIERS: DesignSizeTier[] = ["SMALL", "MEDIUM", "BIG"];

function tierArg(): DesignSizeTier[] | "all" {
  const raw = process.argv.find((a) => a.startsWith("--tier="))?.split("=")[1]?.toUpperCase();
  if (!raw || raw === "ALL") return "all";
  if (raw === "SMALL" || raw === "MEDIUM" || raw === "BIG") return [raw];
  throw new Error(`Unknown tier "${raw}". Use small, medium, big, or all.`);
}

function isStaticAssetPath(imagePath: string | null | undefined, tier: DesignSizeTier): boolean {
  if (!imagePath) return false;
  const slug = folderSlugForTier(tier);
  return (
    imagePath.includes(`/${slug}/MAG-`) &&
    (imagePath.startsWith("/assets/catalog/") ||
      imagePath.startsWith("/api/media/assets/catalog/") ||
      imagePath.includes(`/api/media/assets/catalog/${slug}/`))
  );
}

async function fullBufferForTier(tier: DesignSizeTier, index: number, catalogNumber: string): Promise<Buffer> {
  const relPath = maggamCatalogFullRelPath(tier, catalogNumber);
  const key = storageKeyFromStoredUrl(relPath) ?? relPath;
  try {
    const { body } = await fetchStoredObject(key);
    return body;
  } catch {
    return renderMaggamBlouse(index, tier, catalogNumber);
  }
}

async function saveThumb(tier: DesignSizeTier, catalogNumber: string, fullBuffer: Buffer): Promise<void> {
  const thumbBuffer = await renderMaggamBlouseThumb(fullBuffer);
  await saveCatalogAsset(thumbBuffer, maggamCatalogThumbRelPath(tier, catalogNumber));
}

async function seedTier(tier: DesignSizeTier) {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let thumbsUploaded = 0;
  let protectedAdmin = 0;

  console.log(`\nMaggam ${tier}${PLACEHOLDERS ? " (creating placeholders)" : " (thumbs sync only)"}…`);

  for (let n = 1; n <= TARGET_COUNT; n++) {
    const catalogNumber = catalogNumberFor(tier, n);
    const existing = await prisma.design.findFirst({ where: { catalogNumber } });

    if (existing && isAdminCatalogUploadImagePath(existing.imagePath)) {
      protectedAdmin++;
      continue;
    }

    if (!PLACEHOLDERS) {
      if (!existing || !isSeedMaggamPlaceholderImagePath(existing.imagePath)) {
        skipped++;
        continue;
      }
      try {
        const full = await fullBufferForTier(tier, n, catalogNumber);
        await saveThumb(tier, catalogNumber, full);
        thumbsUploaded++;
      } catch (e) {
        console.warn(`  thumb skip ${catalogNumber}:`, e instanceof Error ? e.message : e);
      }
      continue;
    }

    if (existing && isStaticAssetPath(existing.imagePath, tier) && !FORCE) {
      skipped++;
      try {
        const full = await fullBufferForTier(tier, n, catalogNumber);
        await saveThumb(tier, catalogNumber, full);
        thumbsUploaded++;
      } catch (e) {
        console.warn(`  thumb skip ${catalogNumber}:`, e instanceof Error ? e.message : e);
      }
      continue;
    }

    const buffer = await renderMaggamBlouse(n, tier, catalogNumber);
    const imagePath = await saveCatalogAsset(buffer, maggamCatalogFullRelPath(tier, catalogNumber));
    await saveThumb(tier, catalogNumber, buffer);
    thumbsUploaded++;
    const title = titleForIndex(n);

    if (existing) {
      if (
        existing.imagePath &&
        !existing.imagePath.includes("placeholder") &&
        !isStaticAssetPath(existing.imagePath, tier)
      ) {
        await deleteStoredUpload(existing.imagePath);
      }
      await prisma.design.update({
        where: { id: existing.id },
        data: {
          title,
          imagePath,
          imagesJson: JSON.stringify([imagePath]),
          category: "MAGGAM",
          sizeTier: tier,
          isCatalog: true,
          shopId: null,
          active: true,
          workType: "STITCHING",
        },
      });
      updated++;
    } else {
      await prisma.design.create({
        data: {
          isCatalog: true,
          shopId: null,
          catalogNumber,
          title,
          category: "MAGGAM",
          sizeTier: tier,
          workType: "STITCHING",
          imagePath,
          imagesJson: JSON.stringify([imagePath]),
          active: true,
        },
      });
      created++;
    }

    if (n % 25 === 0) console.log(`  … ${n}/${TARGET_COUNT}`);
  }

  const total = await prisma.design.count({
    where: { isCatalog: true, category: "MAGGAM", sizeTier: tier, active: true },
  });

  console.log(
    `Maggam ${tier}: ${total} in catalog (${created} created, ${updated} updated, ${skipped} skipped, ${protectedAdmin} admin protected, ${thumbsUploaded} thumbs on R2).`
  );
}

async function main() {
  const selected = tierArg();
  const tiers = selected === "all" ? TIERS : selected;

  if (!PLACEHOLDERS) {
    console.log("Safe mode: thumbs sync for existing seed placeholders only.");
    console.log("Will NOT create synthetic designs. Admin uploads are never touched.");
    console.log("Demo placeholders: npm run db:seed-maggam -- --placeholders\n");
  }

  for (const tier of tiers) {
    await seedTier(tier);
  }

  console.log("\nDone.");
  console.log("Remove seed placeholders: CONFIRM=yes npm run catalog:remove-seed-maggam");
  console.log("Assign admin uploads: npm run catalog:assign-unassigned -- --category=maggam --tier=small --apply");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
