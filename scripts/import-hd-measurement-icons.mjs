/**
 * Import user-provided HD measurement icons into public/measurement-icons/{type}/
 * Run: npm run measurement-icons:import-hd
 *      npm run measurement-icons:import-hd:dress
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";

/** HD output width (retina); height scales to preserve aspect. */
const HD_WIDTH = 552;

const CONFIG = {
  blouse: {
    fields: [
      "length",
      "bust",
      "underBust",
      "waist",
      "armLength",
      "bicep",
      "armHole",
      "frontNeck",
      "backNeck",
      "shoulder",
    ],
    optional: ["length"],
  },
  dress: {
    fields: [
      "length",
      "shoulder",
      "overBust",
      "bust",
      "waist",
      "hip",
      "armHole",
      "armLength",
      "bicep",
      "wrist",
    ],
    customFrom: "length",
    /** Fields with no HD source yet — keep existing output file. */
    optional: ["waist"],
  },
};

async function toHdPng(input, output) {
  const meta = await sharp(input).metadata();
  const scale = HD_WIDTH / (meta.width || HD_WIDTH);
  const height = Math.round((meta.height || 174) * scale);
  await sharp(input)
    .resize(HD_WIDTH, height, { kernel: sharp.kernel.lanczos3, fit: "fill" })
    .png({ compressionLevel: 6, effort: 10 })
    .toFile(output);
}

async function importType(type) {
  const cfg = CONFIG[type];
  const sourceDir = join(process.cwd(), "public", "assets", "measurement-icons-hd", type);
  const outDir = join(process.cwd(), "public", "measurement-icons", type);
  mkdirSync(outDir, { recursive: true });

  let count = 0;
  for (const field of cfg.fields) {
    const src = join(sourceDir, `${field}.png`);
    const out = join(outDir, `${field}.png`);
    if (!existsSync(src)) {
      if (cfg.optional?.includes(field) && existsSync(out)) {
        console.log(`  ${type}/${field}.png (kept existing — no HD source)`);
        continue;
      }
      throw new Error(`Missing source: ${src}`);
    }
    await toHdPng(src, out);
    console.log(`  ${type}/${field}.png`);
    count += 1;
  }

  const customSrc = cfg.customFrom ? join(sourceDir, `${cfg.customFrom}.png`) : null;
  const customOut = join(outDir, "custom.png");
  if (customSrc && existsSync(customSrc)) {
    await toHdPng(customSrc, customOut);
    console.log(`  ${type}/custom.png`);
    count += 1;
  }

  console.log(
    `\nImported ${count} HD ${type} icons at ${HD_WIDTH}px width. Sources: ${readdirSync(sourceDir).join(", ")}`
  );
}

async function main() {
  const arg = process.argv[2];
  const types = arg ? [arg] : Object.keys(CONFIG);
  for (const type of types) {
    if (!CONFIG[type]) {
      throw new Error(`Unknown type: ${type}. Use: ${Object.keys(CONFIG).join(", ")}`);
    }
    await importType(type);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
