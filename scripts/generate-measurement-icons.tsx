/**
 * Export one SVG file per measurement field to public/measurement-icons/{type}/{field}.svg
 * Run: npm run measurement-icons:generate
 */
import React from "react";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { fieldsForType, MEASUREMENT_TYPES, type MeasurementTypeId } from "../src/lib/measurements";
import { GUIDE_VIEWBOX, MEASUREMENT_TYPE_THEMES } from "../src/lib/measurement-field-guide";
import { renderMeasurementFieldScene } from "../src/lib/measurement-field-scenes";

const OUT_DIR = join(process.cwd(), "public", "measurement-icons");

function buildSvg(type: MeasurementTypeId, fieldKey: string): string {
  const theme = MEASUREMENT_TYPE_THEMES[type];
  const inner = renderToStaticMarkup(
    renderMeasurementFieldScene(type, fieldKey as never, false)
  );
  const { w, h } = GUIDE_VIEWBOX;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" rx="6" fill="${theme.figureFill}" stroke="${theme.figureStroke}" stroke-width="0.6" opacity="0.95"/>
  <g stroke-linecap="round" stroke-linejoin="round">${inner}</g>
</svg>`;
}

let count = 0;

for (const type of MEASUREMENT_TYPES) {
  const dir = join(OUT_DIR, type);
  mkdirSync(dir, { recursive: true });

  for (const { key } of fieldsForType(type)) {
    const filePath = join(dir, `${key}.svg`);
    writeFileSync(filePath, buildSvg(type, key), "utf8");
    count += 1;
    console.log(`  ${type}/${key}.svg`);
  }
}

console.log(`\nGenerated ${count} measurement icons in public/measurement-icons/`);
