/**
 * Generate web + Android launcher icons from the brand sewing-machine logo.
 * Source: public/brand-logo-source.png (or .jpg)
 * Run: node scripts/generate-app-logo.mjs
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

const sourceCandidates = [
  join(publicDir, "brand-logo-source.png"),
  join(publicDir, "brand-logo-source.jpg"),
  join(publicDir, "brand-logo-source.jpeg"),
];

const sourcePath = sourceCandidates.find((p) => existsSync(p));
if (!sourcePath) {
  console.error("Missing public/brand-logo-source.png (or .jpg)");
  process.exit(1);
}

const BRAND_GREEN = { r: 0x1b, g: 0x30, b: 0x22 };

async function squarePng(size) {
  return sharp(sourcePath)
    .resize(size, size, { fit: "cover", position: "centre" })
    .flatten({ background: BRAND_GREEN })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Adaptive foreground: slightly padded so the machine sits in the safe zone. */
async function foregroundPng(size) {
  const inner = Math.round(size * 0.72);
  const art = await sharp(sourcePath)
    .resize(inner, inner, { fit: "contain", background: BRAND_GREEN })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { ...BRAND_GREEN, alpha: 1 },
    },
  })
    .composite([{ input: art, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writePng(buf, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(buf).toFile(outPath);
  const meta = await sharp(outPath).metadata();
  const rel = outPath.startsWith(root) ? outPath.slice(root.length + 1) : outPath;
  console.log(`${rel}: ${meta.width}x${meta.height}`);
}

const webOutputs = [
  { file: "logo.png", size: 1024 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-192.png", size: 192 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of webOutputs) {
  await writePng(await squarePng(size), join(publicDir, file));
}

const playStoreDir = join(root, "play-store");
mkdirSync(playStoreDir, { recursive: true });
await writePng(await squarePng(512), join(playStoreDir, "icon-512.png"));

/** Legacy + adaptive launcher densities (px). */
const mipmapSizes = {
  "mipmap-mdpi": { launcher: 48, foreground: 108 },
  "mipmap-hdpi": { launcher: 72, foreground: 162 },
  "mipmap-xhdpi": { launcher: 96, foreground: 216 },
  "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
  "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

const androidApps = [
  join(root, "android", "app", "src", "main", "res"),
  join(root, "android-work-partner", "app", "src", "main", "res"),
];

for (const resDir of androidApps) {
  if (!existsSync(resDir)) {
    console.warn(`Skip missing Android res: ${resDir}`);
    continue;
  }

  for (const [folder, sizes] of Object.entries(mipmapSizes)) {
    const dir = join(resDir, folder);
    const launcher = await squarePng(sizes.launcher);
    const fg = await foregroundPng(sizes.foreground);
    await writePng(launcher, join(dir, "ic_launcher.png"));
    await writePng(launcher, join(dir, "ic_launcher_round.png"));
    await writePng(fg, join(dir, "ic_launcher_foreground.png"));
  }

  // Splash drawables — density-sized (avoid 1024×1024 in every folder).
  const splashByFolder = {
    drawable: 480,
    "drawable-port-mdpi": 320,
    "drawable-port-hdpi": 480,
    "drawable-port-xhdpi": 720,
    "drawable-port-xxhdpi": 960,
    "drawable-port-xxxhdpi": 1280,
    "drawable-land-mdpi": 320,
    "drawable-land-hdpi": 480,
    "drawable-land-xhdpi": 720,
    "drawable-land-xxhdpi": 960,
    "drawable-land-xxxhdpi": 1280,
  };
  for (const [folder, size] of Object.entries(splashByFolder)) {
    const out = join(resDir, folder, "splash.png");
    if (existsSync(dirname(out))) {
      await writePng(await squarePng(size), out);
    }
  }
}

copyFileSync(join(publicDir, "logo.png"), join(publicDir, "brand-logo-master.png"));

console.log("App logo + launcher icons updated from brand-logo-source");
