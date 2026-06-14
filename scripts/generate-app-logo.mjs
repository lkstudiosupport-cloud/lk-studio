/**
 * Rasterize public/icon.svg to HD PNGs for app logo and PWA icons.
 * Run: node scripts/generate-app-logo.mjs
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svgPath = join(publicDir, "icon.svg");

const outputs = [
  { file: "logo.png", size: 1024 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-192.png", size: 192 },
  { file: "apple-touch-icon.png", size: 180 },
];

if (!existsSync(svgPath)) {
  console.error(`Missing source SVG: ${svgPath}`);
  process.exit(1);
}

for (const { file, size } of outputs) {
  const outPath = join(publicDir, file);
  await sharp(svgPath, { density: 300 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`${file}: ${meta.width}x${meta.height}`);
}

console.log("App logo PNGs generated from icon.svg");
