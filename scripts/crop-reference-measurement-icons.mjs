/**
 * Crop measurement guide icons from the reference tailoring-app screenshot.
 * Run: npm run measurement-icons:generate
 */
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const REFERENCE = join(process.cwd(), "public", "assets", "measurement-reference-screens.jpg");
const OUT_DIR = join(process.cwd(), "public", "measurement-icons");

/** Full white icon card from each list row in the reference screenshot (1024×682). */
const ROW_TOP = 125;
const ROW_STEP = 54;
const ICON_W = 92;
const ICON_H = 58;
const OUT_W = 276;
const OUT_H = 174;

const PANELS = {
  /** blouse/length.png is user-provided — run measurement-icons:import-hd after updating HD source */
  blouse: {
    left: 22,
    fields: ["bust", "underBust", "waist", "shoulder", "frontNeck", "backNeck", "armHole", "armLength", "bicep", "sleeve"],
  },
  dress: { left: 360, fields: ["length", "shoulder", "overBust", "bust", "waist", "hip", "armHole", "armLength", "bicep", "wrist"] },
  child: { left: 700, fields: ["length", "chest", "waist", "hip", "shoulder", "armHole", "armLength", "neck", "blouseLen", "trouserThreeQuarter"] },
};

async function cropIcon(top, left, outPath) {
  await sharp(REFERENCE)
    .extract({ left, top, width: ICON_W, height: ICON_H })
    .resize(OUT_W, OUT_H, { fit: "fill" })
    .png({ compressionLevel: 9 })
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
      const override = panel.fieldCrops?.[field];
      const left = override?.left ?? panel.left;
      const row =
        override?.row ??
        (panel.fields[0] === "length" && field !== "length" ? i - 1 : i);
      const top = ROW_TOP + row * ROW_STEP;
      const outPath = join(dir, `${field}.png`);
      await cropIcon(top, left, outPath);
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
