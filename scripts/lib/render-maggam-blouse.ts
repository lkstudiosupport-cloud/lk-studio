/**
 * Procedural maggam-work-on-blouse catalog images — 100% original SVG art (no scraped photos).
 */
import sharp from "sharp";
import type { DesignSizeTier } from "@prisma/client";

const W = 600;
const H = 800;

const PATTERN_NAMES = [
  "Temple border",
  "Peacock motif",
  "Floral vine",
  "Zari chain",
  "Leaf garland",
  "Paisley line",
  "Lotus band",
  "Mango motif",
  "Diya pattern",
  "Rangoli edge",
  "Coin row",
  "Bead trail",
  "Swirl border",
  "Arch motif",
  "Sunburst band",
  "Wave line",
  "Diamond row",
  "Star cluster",
  "Butterfly pair",
  "Crown border",
];

const FABRICS: { base: string; mid: string; light: string }[] = [
  { base: "#b91372", mid: "#d63384", light: "#f065a5" },
  { base: "#6b0f1a", mid: "#9b1b30", light: "#c9184a" },
  { base: "#1e3a5f", mid: "#2c5282", light: "#4299e1" },
  { base: "#14532d", mid: "#166534", light: "#22c55e" },
  { base: "#4a044e", mid: "#701a75", light: "#a21caf" },
  { base: "#78350f", mid: "#92400e", light: "#d97706" },
  { base: "#134e4a", mid: "#0f766e", light: "#14b8a6" },
  { base: "#1e1b4b", mid: "#312e81", light: "#6366f1" },
  { base: "#7f1d1d", mid: "#991b1b", light: "#ef4444" },
  { base: "#365314", mid: "#4d7c0f", light: "#84cc16" },
];

const GOLD = "#c9a227";
const GOLD_LIGHT = "#f5d78e";
const GOLD_DARK = "#8b6914";
const ACCENT = ["#c9184a", "#7c3aed", "#0891b2", "#ea580c", "#be123c"];

function seeded(index: number, salt: number): number {
  return ((index * 7919 + salt * 104729) % 1000) / 1000;
}

export function titleForIndex(index: number): string {
  const name = PATTERN_NAMES[(index - 1) % PATTERN_NAMES.length]!;
  const batch = Math.floor((index - 1) / PATTERN_NAMES.length) + 1;
  return batch > 1 ? `${name} ${batch}` : name;
}

function fabricSvg(index: number): string {
  const f = FABRICS[index % FABRICS.length]!;
  const weave = Array.from({ length: 18 }, (_, row) => {
    const y = 40 + row * 42;
    const opacity = 0.04 + (row % 3) * 0.015;
    return `<line x1="0" y1="${y}" x2="${W}" y2="${y + 8}" stroke="${f.light}" stroke-width="1" opacity="${opacity}"/>`;
  }).join("");

  return `
    <defs>
      <linearGradient id="silk" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${f.light}"/>
        <stop offset="45%" stop-color="${f.mid}"/>
        <stop offset="100%" stop-color="${f.base}"/>
      </linearGradient>
      <clipPath id="blouse">
        <path d="M 60 90 Q 300 40 540 90 L 560 760 Q 300 790 40 760 Z"/>
      </clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="#f3f0ea"/>
    <g clip-path="url(#blouse)">
      <rect width="${W}" height="${H}" fill="url(#silk)"/>
      ${weave}
      <ellipse cx="300" cy="115" rx="95" ry="38" fill="${f.base}" opacity="0.35"/>
      <path d="M 120 130 Q 300 175 480 130" fill="none" stroke="${f.base}" stroke-width="2" opacity="0.25"/>
    </g>
    <path d="M 60 90 Q 300 40 540 90 L 560 760 Q 300 790 40 760 Z" fill="none" stroke="#2d2a26" stroke-width="1.5" opacity="0.2"/>
  `;
}

function bead(cx: number, cy: number, r: number, color = GOLD_LIGHT): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${GOLD_DARK}" stroke-width="0.5"/>`;
}

function zariLine(x1: number, y1: number, x2: number, y2: number, w = 2): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GOLD}" stroke-width="${w}" stroke-linecap="round"/>`;
}

function templeArch(x: number, y: number, w: number, h: number, accent: string): string {
  const mid = x + w / 2;
  return `
    ${zariLine(x, y + h, x + w, y + h, 3)}
    <path d="M ${x} ${y + h} Q ${mid} ${y} ${x + w} ${y + h}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="2.5"/>
    ${bead(mid, y + h * 0.55, 4)}
    <circle cx="${x + w * 0.25}" cy="${y + h * 0.72}" r="5" fill="${accent}" stroke="${GOLD}" stroke-width="1"/>
    <circle cx="${x + w * 0.75}" cy="${y + h * 0.72}" r="5" fill="${accent}" stroke="${GOLD}" stroke-width="1"/>
  `;
}

function peacockFeather(x: number, y: number, scale: number, accent: string): string {
  const s = scale;
  return `
    <ellipse cx="${x}" cy="${y}" rx="${18 * s}" ry="${28 * s}" fill="${accent}" opacity="0.85" stroke="${GOLD}" stroke-width="1.5"/>
    <ellipse cx="${x}" cy="${y - 8 * s}" rx="${8 * s}" ry="${12 * s}" fill="${GOLD_LIGHT}"/>
    ${bead(x, y, 3 * s)}
    ${Array.from({ length: 5 }, (_, i) => {
      const ang = -60 + i * 30;
      const rad = (ang * Math.PI) / 180;
      const lx = x + Math.cos(rad) * 22 * s;
      const ly = y + Math.sin(rad) * 22 * s;
      return zariLine(x, y, lx, ly, 1.2);
    }).join("")}
  `;
}

function floralVine(x: number, y: number, length: number, accent: string): string {
  let svg = zariLine(x, y, x + length, y - length * 0.15, 1.5);
  for (let i = 0; i < 4; i++) {
    const px = x + (length / 4) * i + 10;
    const py = y - (length / 4) * i * 0.12;
    svg += `
      ${bead(px, py, 3)}
      <circle cx="${px + 8}" cy="${py - 6}" r="6" fill="${accent}" stroke="${GOLD}" stroke-width="1"/>
      <circle cx="${px - 6}" cy="${py + 5}" r="5" fill="${GOLD_LIGHT}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
    `;
  }
  return svg;
}

function paisley(x: number, y: number, scale: number, accent: string): string {
  const s = scale;
  return `
    <path d="M ${x} ${y} Q ${x + 20 * s} ${y - 25 * s} ${x + 8 * s} ${y - 40 * s} Q ${x - 5 * s} ${y - 20 * s} ${x} ${y}" fill="${accent}" stroke="${GOLD}" stroke-width="1.2"/>
    ${bead(x + 4 * s, y - 18 * s, 2.5 * s)}
  `;
}

function sunburst(cx: number, cy: number, rays: number, radius: number): string {
  let svg = `<circle cx="${cx}" cy="${cy}" r="${radius * 0.35}" fill="${GOLD_LIGHT}" stroke="${GOLD_DARK}" stroke-width="1"/>`;
  for (let i = 0; i < rays; i++) {
    const ang = (360 / rays) * i;
    const rad = (ang * Math.PI) / 180;
    const x2 = cx + Math.cos(rad) * radius;
    const y2 = cy + Math.sin(rad) * radius;
    svg += zariLine(cx, cy, x2, y2, 1.5);
  }
  return svg;
}

function coinRow(x: number, y: number, count: number): string {
  return Array.from({ length: count }, (_, i) => {
    const cx = x + i * 16;
    return `<circle cx="${cx}" cy="${y}" r="6" fill="${GOLD_LIGHT}" stroke="${GOLD_DARK}" stroke-width="1.2"/>`;
  }).join("");
}

function motifByType(type: number, x: number, y: number, scale: number, accent: string): string {
  switch (type % 10) {
    case 0:
      return templeArch(x, y, 70 * scale, 55 * scale, accent);
    case 1:
      return peacockFeather(x + 20 * scale, y + 20 * scale, scale, accent);
    case 2:
      return floralVine(x, y, 80 * scale, accent);
    case 3:
      return coinRow(x, y, Math.floor(6 * scale));
    case 4:
      return paisley(x, y, scale, accent);
    case 5:
      return sunburst(x + 25 * scale, y + 25 * scale, 10, 30 * scale);
    case 6:
      return `
        ${zariLine(x, y, x + 60 * scale, y, 2)}
        ${zariLine(x, y + 6, x + 60 * scale, y + 6, 1)}
        ${Array.from({ length: 5 }, (_, i) => bead(x + 12 * i * scale, y + 3, 2.5)).join("")}
      `;
    case 7:
      return `
        <path d="M ${x} ${y + 30 * scale} L ${x + 15 * scale} ${y} L ${x + 30 * scale} ${y + 30 * scale} Z" fill="${GOLD_LIGHT}" stroke="${GOLD_DARK}" stroke-width="1"/>
        <path d="M ${x + 35 * scale} ${y + 30 * scale} L ${x + 50 * scale} ${y} L ${x + 65 * scale} ${y + 30 * scale} Z" fill="${accent}" stroke="${GOLD}" stroke-width="1"/>
      `;
    case 8:
      return `
        ${bead(x, y, 4)}${bead(x + 20 * scale, y + 5, 3)}${bead(x + 40 * scale, y, 4)}
        ${zariLine(x, y, x + 40 * scale, y + 2, 1.5)}
      `;
    default:
      return `
        <rect x="${x}" y="${y}" width="${50 * scale}" height="${8 * scale}" rx="3" fill="none" stroke="${GOLD}" stroke-width="1.5"/>
        ${bead(x + 25 * scale, y + 4 * scale, 3)}
      `;
  }
}

function embroideryForTier(index: number, tier: DesignSizeTier): string {
  const accent = ACCENT[index % ACCENT.length]!;
  const type = index % PATTERN_NAMES.length;
  const scale = tier === "SMALL" ? 0.85 : tier === "MEDIUM" ? 1.05 : 1.25;

  if (tier === "SMALL") {
    const y = 620 + (index % 5) * 4;
    return `
      <g opacity="0.95">
        ${motifByType(type, 80, y - 40, scale, accent)}
        ${motifByType(type + 3, 280, y - 35, scale * 0.9, accent)}
        ${motifByType(type + 7, 420, y - 38, scale * 0.85, accent)}
        ${coinRow(100, y + 25, 22)}
        ${zariLine(70, y + 38, 530, y + 38, 3)}
        ${zariLine(90, 130, 510, 130, 1.5)}
        ${Array.from({ length: 8 }, (_, i) => bead(120 + i * 50, 128, 2.5)).join("")}
      </g>
    `;
  }

  if (tier === "MEDIUM") {
    const panelY = 280;
    return `
      <g opacity="0.96">
        ${motifByType(type, 200, panelY, scale, accent)}
        ${motifByType(type + 2, 320, panelY + 60, scale * 0.95, accent)}
        ${peacockFeather(300, 420, scale * 0.9, accent)}
        ${floralVine(120, 580, 100, accent)}
        ${floralVine(380, 590, 90, accent)}
        ${coinRow(90, 640, 24)}
        ${zariLine(70, 655, 530, 655, 3)}
        ${templeArch(220, 180, 160, 70, accent)}
        ${zariLine(100, 150, 500, 150, 2)}
      </g>
    `;
  }

  return `
    <g opacity="0.97">
      ${sunburst(300, 360, 14 + (index % 4), 95 * scale)}
      ${motifByType(type, 130, 220, scale, accent)}
      ${motifByType(type + 4, 350, 230, scale, accent)}
      ${motifByType(type + 8, 200, 480, scale * 0.9, accent)}
      ${motifByType(type + 1, 380, 500, scale * 0.85, accent)}
      ${peacockFeather(160, 340, scale, accent)}
      ${peacockFeather(420, 350, scale, accent)}
      ${floralVine(90, 600, 120, accent)}
      ${floralVine(350, 610, 110, accent)}
      ${coinRow(80, 670, 26)}
      ${zariLine(60, 685, 540, 685, 4)}
      ${templeArch(180, 150, 240, 90, accent)}
      ${zariLine(80, 140, 520, 140, 2.5)}
      ${Array.from({ length: 10 }, (_, i) => bead(100 + i * 42, 138, 3)).join("")}
    </g>
  `;
}

function labelSvg(catalogNumber: string): string {
  return `
    <rect x="12" y="748" width="210" height="36" rx="8" fill="rgba(0,0,0,0.55)"/>
    <text x="24" y="772" fill="${GOLD_LIGHT}" font-family="Georgia, serif" font-size="16" font-weight="bold">${catalogNumber}</text>
  `;
}

function buildSvg(index: number, tier: DesignSizeTier, catalogNumber: string): string {
  const shimmer = seeded(index, 7) * 0.08;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${fabricSvg(index)}
  <g clip-path="url(#blouse)" opacity="${0.92 + shimmer}">
    ${embroideryForTier(index, tier)}
  </g>
  ${labelSvg(catalogNumber)}
</svg>`;
}

export async function renderMaggamBlouse(
  index: number,
  tier: DesignSizeTier,
  catalogNumber: string
): Promise<Buffer> {
  const svg = buildSvg(index, tier, catalogNumber);
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

export function catalogNumberFor(tier: DesignSizeTier, index: number): string {
  const prefix = tier === "SMALL" ? "MAG-S" : tier === "MEDIUM" ? "MAG-M" : "MAG-B";
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

export function folderSlugForTier(tier: DesignSizeTier): string {
  return tier === "SMALL" ? "maggam-small" : tier === "MEDIUM" ? "maggam-medium" : "maggam-big";
}
