/**
 * Seeds 100 catalog maggam designs per size tier (SMALL / MEDIUM / BIG).
 * Uploads full JPG + thumb JPG to R2 (Option B) with 30-day browser cache via /api/media (G1).
 *
 * Run all tiers:     npm run db:seed-maggam
 * One tier:          npm run db:seed-maggam -- --tier=medium
 * Force regenerate:  npm run db:seed-maggam -- --force
 * Thumbs only:       npm run catalog:sync-maggam-thumbs
 */
import { PrismaClient, type DesignSizeTier } from "@prisma/client";
import { deleteStoredUpload, saveCatalogAsset } from "../src/lib/storage";
import { fetchStoredObject } from "../src/lib/fetch-stored-object";
import { storageKeyFromStoredUrl } from "../src/lib/storage-url";
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

  console.log(`\nGenerating maggam ${tier} (${TARGET_COUNT} images)…`);

  for (let n = 1; n <= TARGET_COUNT; n++) {
    const catalogNumber = catalogNumberFor(tier, n);
    const existing = await prisma.design.findFirst({ where: { catalogNumber } });

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
    `Maggam ${tier}: ${total} in catalog (${created} created, ${updated} updated, ${skipped} skipped, ${thumbsUploaded} thumbs on R2).`
  );
}

async function main() {
  const selected = tierArg();
  const tiers = selected === "all" ? TIERS : selected;

  for (const tier of tiers) {
    await seedTier(tier);
  }

  console.log("\nDone. Thumbs-only backfill: npm run catalog:sync-maggam-thumbs");
  console.log("Export for download: npm run catalog:export-maggam");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
