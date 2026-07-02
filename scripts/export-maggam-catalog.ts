/**
 * Copies maggam catalog JPGs into downloads/maggam-work-catalog/ and creates a zip.
 *
 * Run: npm run catalog:export-maggam
 */
import { cp, mkdir, readdir, writeFile } from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import type { DesignSizeTier } from "@prisma/client";
import { folderSlugForTier } from "./lib/render-maggam-blouse";

const TIERS: { tier: DesignSizeTier; folder: string }[] = [
  { tier: "SMALL", folder: "small" },
  { tier: "MEDIUM", folder: "medium" },
  { tier: "BIG", folder: "big" },
];

const DOWNLOAD_ROOT = path.join(process.cwd(), "downloads", "maggam-work-catalog");
const LICENSE = `LK Studio Maggam Work Catalog — Original Artwork
=====================================================

These 300 images (100 small, 100 medium, 100 big) were procedurally generated
for LK Studio. They are original SVG artwork rendered to JPEG — not copied
from photos, Pinterest, or third-party catalogs.

You may use them in LK Studio and for your tailoring shop catalog without
royalty fees. Do not resell the raw image pack as a standalone stock product.

Generated: ${new Date().toISOString().slice(0, 10)}
`;

async function copyTier(tier: DesignSizeTier, destFolder: string): Promise<number> {
  const src = path.join(process.cwd(), "public", "assets", "catalog", folderSlugForTier(tier));
  const dest = path.join(DOWNLOAD_ROOT, destFolder);
  await mkdir(dest, { recursive: true });

  const files = (await readdir(src)).filter((f) => f.endsWith(".jpg")).sort();
  for (const file of files) {
    await cp(path.join(src, file), path.join(dest, file));
  }

  const thumbSrc = path.join(src, "thumbs");
  try {
    const thumbFiles = (await readdir(thumbSrc)).filter((f) => f.endsWith(".jpg")).sort();
    if (thumbFiles.length > 0) {
      const thumbDest = path.join(dest, "thumbs");
      await mkdir(thumbDest, { recursive: true });
      for (const file of thumbFiles) {
        await cp(path.join(thumbSrc, file), path.join(thumbDest, file));
      }
    }
  } catch {
    // thumbs optional for local export
  }

  return files.length;
}

async function main() {
  await mkdir(DOWNLOAD_ROOT, { recursive: true });
  await writeFile(path.join(DOWNLOAD_ROOT, "LICENSE.txt"), LICENSE, "utf8");

  let total = 0;
  for (const { tier, folder } of TIERS) {
    const count = await copyTier(tier, folder);
    console.log(`${folder}: ${count} images`);
    total += count;
  }

  const zipPath = path.join(process.cwd(), "downloads", "maggam-work-catalog.zip");
  execSync(`tar -a -cf "${zipPath.replace(/\\/g, "/")}" -C "${DOWNLOAD_ROOT.replace(/\\/g, "/")}" .`, {
    stdio: "inherit",
  });

  console.log(`\nExported ${total} images.`);
  console.log(`Folder: ${DOWNLOAD_ROOT}`);
  console.log(`Zip:    ${zipPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
