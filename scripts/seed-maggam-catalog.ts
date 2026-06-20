/**
 * Seeds 100 catalog maggam designs per size tier (SMALL / MEDIUM / BIG).
 * Images are procedurally generated — original artwork, safe for commercial use in LK Studio.
 *
 * Run all tiers:  npm run db:seed-maggam
 * One tier:       npm run db:seed-maggam -- --tier=medium
 * Force regenerate: npm run db:seed-maggam -- --force
 */
import { PrismaClient, type DesignSizeTier } from "@prisma/client";
import { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { deleteStoredUpload } from "../src/lib/storage";
import {
  catalogNumberFor,
  folderSlugForTier,
  renderMaggamBlouse,
  titleForIndex,
} from "./lib/render-maggam-blouse";

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

function assetDir(tier: DesignSizeTier): string {
  return path.join(process.cwd(), "public", "assets", "catalog", folderSlugForTier(tier));
}

function assetUrlPrefix(tier: DesignSizeTier): string {
  return `/assets/catalog/${folderSlugForTier(tier)}`;
}

function isStaticAssetPath(imagePath: string | null | undefined, tier: DesignSizeTier): boolean {
  return Boolean(imagePath?.startsWith(assetUrlPrefix(tier)));
}

async function seedTier(tier: DesignSizeTier) {
  const dir = assetDir(tier);
  const urlPrefix = assetUrlPrefix(tier);
  await mkdir(dir, { recursive: true });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log(`\nGenerating maggam ${tier} (${TARGET_COUNT} images)…`);

  for (let n = 1; n <= TARGET_COUNT; n++) {
    const catalogNumber = catalogNumberFor(tier, n);
    const existing = await prisma.design.findFirst({ where: { catalogNumber } });
    const imagePath = `${urlPrefix}/${catalogNumber}.jpg`;
    const outFile = path.join(dir, `${catalogNumber}.jpg`);

    if (existing && isStaticAssetPath(existing.imagePath, tier) && !FORCE) {
      skipped++;
      continue;
    }

    const buffer = await renderMaggamBlouse(n, tier, catalogNumber);
    await sharp(buffer).toFile(outFile);
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
    `Maggam ${tier}: ${total} in catalog (${created} created, ${updated} updated, ${skipped} skipped).`
  );
  console.log(`Files: ${urlPrefix}/${catalogNumberFor(tier, 1)}.jpg … ${catalogNumberFor(tier, TARGET_COUNT)}.jpg`);
}

async function main() {
  const selected = tierArg();
  const tiers = selected === "all" ? TIERS : selected;

  for (const tier of tiers) {
    await seedTier(tier);
  }

  console.log("\nDone. Export for download: npm run catalog:export-maggam");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
