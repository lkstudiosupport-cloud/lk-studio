/**
 * Crop measurement guide icons from the reference tailoring-app screenshot.
 * Run: npm run measurement-icons:generate
 */
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const REFERENCE = join(process.cwd(), "public", "assets", "measurement-reference-screens.jpg");
const OUT_DIR = join(process.cwd(), "public", "measurement-icons");

const ROW_TOP = 130;
const ROW_STEP = 52;
const ICON_W = 78;
const ICON_H = 52;

const PANELS = {
  blouse: { left: 30, fields: ["bust", "underBust", "waist", "shoulder", "frontNeck", "backNeck", "armHole", "armLength", "bicep", "sleeve"] },
  dress: { left: 368, fields: ["length", "shoulder", "overBust", "bust", "waist", "hip", "armHole", "armLength", "bicep", "wrist"] },
  child: { left: 708, fields: ["length", "chest", "waist", "hip", "shoulder", "armHole", "armLength", "neck", "blouseLen", "trouserThreeQuarter"] },
};

async function cropIcon(top, left, outPath) {
  await sharp(REFERENCE)
    .extract({ left, top, width: ICON_W, height: ICON_H })
    .resize(156, 104, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(outPath);
}

async function main() {
  if (!existsSync(REFERENCE)) {
    throw new Error(`Reference image missing: ${REFERENCE}`);
  }

  let count = 0;

  for (const [type, panel] of Object.entries(PANELS)) {
    const dir = join(OUT_DIR, type);
    mkdirSync(dir, { recursive: true });

    for (let i = 0; i < panel.fields.length; i++) {
      const field = panel.fields[i];
      const top = ROW_TOP + i * ROW_STEP;
      const outPath = join(dir, `${field}.png`);
      await cropIcon(top, panel.left, outPath);
      console.log(`  ${type}/${field}.png`);
      count += 1;
    }

    const customPath = join(dir, "custom.png");
    await cropIcon(ROW_TOP, panel.left, customPath);
    console.log(`  ${type}/custom.png`);
    count += 1;
  }

  console.log(`\nCropped ${count} PNG icons from reference into public/measurement-icons/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
