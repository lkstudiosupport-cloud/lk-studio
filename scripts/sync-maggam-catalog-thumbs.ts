/**
 * Upload maggam catalog thumbnails to R2 without regenerating full images or DB rows.
 * Use after deploying Option B when full JPGs already exist on R2.
 *
 * Run: npm run catalog:sync-maggam-thumbs
 * One tier: npm run catalog:sync-maggam-thumbs -- --tier=small
 * Force re-upload: npm run catalog:sync-maggam-thumbs -- --force
 */
import { PrismaClient, type DesignSizeTier } from "@prisma/client";
import { saveCatalogAsset } from "../src/lib/storage";
import { fetchStoredObject } from "../src/lib/fetch-stored-object";
import { storageKeyFromStoredUrl } from "../src/lib/storage-url";
import {
  catalogNumberFor,
  maggamCatalogFullRelPath,
  maggamCatalogThumbRelPath,
  renderMaggamBlouse,
  renderMaggamBlouseThumb,
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

async function thumbExists(tier: DesignSizeTier, catalogNumber: string): Promise<boolean> {
  if (FORCE) return false;
  const key = maggamCatalogThumbRelPath(tier, catalogNumber);
  try {
    await fetchStoredObject(key);
    return true;
  } catch {
    return false;
  }
}

async function fullBufferForDesign(
  tier: DesignSizeTier,
  index: number,
  catalogNumber: string,
  imagePath: string | null
): Promise<Buffer> {
  if (imagePath) {
    const key = storageKeyFromStoredUrl(imagePath);
    if (key) {
      try {
        const { body } = await fetchStoredObject(key);
        return body;
      } catch {
        // fall through
      }
    }
  }

  const relPath = maggamCatalogFullRelPath(tier, catalogNumber);
  const fallbackKey = storageKeyFromStoredUrl(relPath) ?? relPath;
  try {
    const { body } = await fetchStoredObject(fallbackKey);
    return body;
  } catch {
    return renderMaggamBlouse(index, tier, catalogNumber);
  }
}

async function syncTier(tier: DesignSizeTier) {
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`\nSyncing maggam ${tier} thumbs…`);

  for (let n = 1; n <= TARGET_COUNT; n++) {
    const catalogNumber = catalogNumberFor(tier, n);
    if (await thumbExists(tier, catalogNumber)) {
      skipped++;
      continue;
    }

    const existing = await prisma.design.findFirst({
      where: { catalogNumber },
      select: { imagePath: true },
    });

    try {
      const full = await fullBufferForDesign(tier, n, catalogNumber, existing?.imagePath ?? null);
      const thumb = await renderMaggamBlouseThumb(full);
      await saveCatalogAsset(thumb, maggamCatalogThumbRelPath(tier, catalogNumber));
      uploaded++;
    } catch (e) {
      failed++;
      console.warn(`  failed ${catalogNumber}:`, e instanceof Error ? e.message : e);
    }

    if (n % 25 === 0) console.log(`  … ${n}/${TARGET_COUNT}`);
  }

  console.log(`Maggam ${tier} thumbs: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed.`);
}

async function main() {
  const selected = tierArg();
  const tiers = selected === "all" ? TIERS : selected;

  for (const tier of tiers) {
    await syncTier(tier);
  }

  console.log("\nDone. Grids load /api/media/.../thumbs/… with 30-day browser cache.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
