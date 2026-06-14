/**
 * Import user-provided HD blouse measurement icons into public/measurement-icons/blouse/
 * Run: npm run measurement-icons:import-hd
 */
import { copyFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const SOURCE_DIR = join(process.cwd(), "public", "assets", "measurement-icons-hd", "blouse");
const OUT_DIR = join(process.cwd(), "public", "measurement-icons", "blouse");

/** HD output width (retina); height scales to preserve aspect. */
const HD_WIDTH = 552;

const FIELDS = [
  "bust",
  "underBust",
  "waist",
  "shoulder",
  "frontNeck",
  "backNeck",
  "armHole",
  "armLength",
  "bicep",
  "sleeve",
];

async function toHdPng(input, output) {
  const meta = await sharp(input).metadata();
  const scale = HD_WIDTH / (meta.width || HD_WIDTH);
  const height = Math.round((meta.height || 174) * scale);
  await sharp(input)
    .resize(HD_WIDTH, height, { kernel: sharp.kernel.lanczos3, fit: "fill" })
    .png({ compressionLevel: 6, effort: 10 })
    .toFile(output);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const field of FIELDS) {
    const src = join(SOURCE_DIR, `${field}.png`);
    const out = join(OUT_DIR, `${field}.png`);
    await toHdPng(src, out);
    console.log(`  blouse/${field}.png`);
  }

  copyFileSync(join(SOURCE_DIR, "bust.png"), join(OUT_DIR, "custom.png"));
  await toHdPng(join(SOURCE_DIR, "bust.png"), join(OUT_DIR, "custom.png"));
  console.log(`  blouse/custom.png`);

  console.log(`\nImported ${FIELDS.length + 1} HD blouse icons at ${HD_WIDTH}px width.`);
  console.log(`Source files: ${readdirSync(SOURCE_DIR).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
