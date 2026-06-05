import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";
import { letterForField, MEASUREMENT_TYPE_CONFIG } from "@/lib/measurements";

export type DiagramView = "front" | "side" | "back";

export const FIGURE_VIEWBOX = { w: 200, h: 420 };
export const BLOUSE_VIEWBOX = { w: 200, h: 300 };

export type DiagramLine = {
  key: MeasurementFieldKey;
  view: DiagramView;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lx: number;
  ly: number;
  letter?: string;
  chart?: boolean;
};

export const MEASUREMENT_ACTIVE_COLORS: Record<string, string> = {
  overBust: "#f472b6",
  underBust: "#ec4899",
  neckToAboveKnee: "#a855f7",
  aboveKneeToAnkle: "#8b5cf6",
  bicep: "#6366f1",
  foreArm: "#4f46e5",
  wrist: "#4338ca",
  waist: "#fb923c",
  hip: "#facc15",
  highHip: "#a3e635",
  backWaist: "#38bdf8",
  frontWaist: "#c084fc",
  inseam: "#34d399",
  armLength: "#60a5fa",
  trouserThreeQuarter: "#f97316",
  length: "#22d3ee",
  shoulder: "#a78bfa",
  armHole: "#e879f9",
  chest: "#fb7185",
  blouseLen: "#2dd4bf",
  sleeve: "#818cf8",
  neck: "#a78bfa",
  frontNeck: "#e879f9",
  backNeck: "#d946ef",
  slit: "#94a3b8",
  custom: "#64748b",
};

const BLOUSE_LINES: DiagramLine[] = [
  { key: "shoulder", view: "front", chart: true, x1: 38, y1: 72, x2: 162, y2: 72, lx: 168, ly: 72 },
  { key: "armHole", view: "front", chart: true, x1: 42, y1: 96, x2: 158, y2: 96, lx: 168, ly: 96 },
  { key: "bust", view: "front", chart: true, x1: 52, y1: 112, x2: 148, y2: 112, lx: 168, ly: 112 },
  { key: "chest", view: "front", chart: true, x1: 54, y1: 128, x2: 146, y2: 128, lx: 168, ly: 128 },
  { key: "waist", view: "front", chart: true, x1: 60, y1: 152, x2: 140, y2: 152, lx: 168, ly: 152 },
  { key: "hip", view: "front", chart: true, x1: 56, y1: 172, x2: 144, y2: 172, lx: 168, ly: 172 },
  { key: "blouseLen", view: "front", chart: true, x1: 100, y1: 74, x2: 100, y2: 228, lx: 116, ly: 150 },
  { key: "armLength", view: "front", chart: true, x1: 24, y1: 76, x2: 24, y2: 218, lx: 10, ly: 148 },
  { key: "sleeve", view: "front", chart: true, x1: 8, y1: 168, x2: 36, y2: 168, lx: 22, ly: 158 },
  { key: "neck", view: "front", chart: true, x1: 86, y1: 52, x2: 114, y2: 52, lx: 100, ly: 42 },
  { key: "frontNeck", view: "front", chart: true, x1: 108, y1: 58, x2: 100, y2: 82, lx: 88, ly: 70 },
  { key: "shoulder", view: "back", chart: true, x1: 38, y1: 72, x2: 162, y2: 72, lx: 168, ly: 72 },
  { key: "backNeck", view: "back", chart: true, x1: 104, y1: 56, x2: 136, y2: 56, lx: 168, ly: 56 },
  { key: "blouseLen", view: "back", chart: true, x1: 100, y1: 74, x2: 100, y2: 228, lx: 116, ly: 150 },
  { key: "slit", view: "back", chart: true, x1: 100, y1: 168, x2: 100, y2: 228, lx: 84, ly: 198 },
];

const DRESS_LINES: DiagramLine[] = [
  { key: "bust", view: "side", chart: true, x1: 72, y1: 98, x2: 128, y2: 98, lx: 148, ly: 98 },
  { key: "waist", view: "side", chart: true, x1: 82, y1: 158, x2: 132, y2: 158, lx: 148, ly: 158 },
  { key: "highHip", view: "side", chart: true, x1: 84, y1: 182, x2: 136, y2: 182, lx: 148, ly: 182 },
  { key: "hip", view: "side", chart: true, x1: 86, y1: 208, x2: 142, y2: 208, lx: 148, ly: 208 },
  { key: "backWaist", view: "side", chart: true, x1: 128, y1: 72, x2: 128, y2: 158, lx: 148, ly: 118 },
  { key: "length", view: "side", chart: true, x1: 118, y1: 158, x2: 118, y2: 398, lx: 148, ly: 280 },
  { key: "bust", view: "front", chart: true, x1: 52, y1: 102, x2: 148, y2: 102, lx: 168, ly: 102 },
  { key: "waist", view: "front", chart: true, x1: 62, y1: 162, x2: 138, y2: 162, lx: 168, ly: 162 },
  { key: "highHip", view: "front", chart: true, x1: 58, y1: 186, x2: 142, y2: 186, lx: 168, ly: 186 },
  { key: "hip", view: "front", chart: true, x1: 54, y1: 212, x2: 146, y2: 212, lx: 168, ly: 212 },
  { key: "frontWaist", view: "front", chart: true, x1: 56, y1: 74, x2: 56, y2: 162, lx: 42, ly: 118 },
  { key: "inseam", view: "front", chart: true, x1: 88, y1: 228, x2: 88, y2: 396, lx: 72, ly: 312 },
  { key: "armLength", view: "front", chart: true, x1: 24, y1: 76, x2: 24, y2: 248, lx: 10, ly: 162 },
  { key: "trouserThreeQuarter", view: "front", chart: true, x1: 112, y1: 162, x2: 112, y2: 328, lx: 128, ly: 245 },
];

const CHILD_LINES: DiagramLine[] = [
  { key: "bust", view: "side", chart: true, x1: 78, y1: 108, x2: 122, y2: 108, lx: 140, ly: 108 },
  { key: "waist", view: "side", chart: true, x1: 84, y1: 148, x2: 124, y2: 148, lx: 140, ly: 148 },
  { key: "hip", view: "side", chart: true, x1: 86, y1: 172, x2: 126, y2: 172, lx: 140, ly: 172 },
  { key: "length", view: "side", chart: true, x1: 112, y1: 148, x2: 112, y2: 340, lx: 140, ly: 245 },
  { key: "shoulder", view: "front", chart: true, x1: 58, y1: 88, x2: 142, y2: 88, lx: 158, ly: 88 },
  { key: "chest", view: "front", chart: true, x1: 62, y1: 108, x2: 138, y2: 108, lx: 158, ly: 108 },
  { key: "bust", view: "front", chart: true, x1: 64, y1: 122, x2: 136, y2: 122, lx: 158, ly: 122 },
  { key: "waist", view: "front", chart: true, x1: 68, y1: 148, x2: 132, y2: 148, lx: 158, ly: 148 },
  { key: "hip", view: "front", chart: true, x1: 66, y1: 172, x2: 134, y2: 172, lx: 158, ly: 172 },
  { key: "blouseLen", view: "front", chart: true, x1: 100, y1: 90, x2: 100, y2: 210, lx: 114, ly: 150 },
  { key: "length", view: "front", chart: true, x1: 72, y1: 28, x2: 72, y2: 340, lx: 56, ly: 185 },
  { key: "armLength", view: "front", chart: true, x1: 32, y1: 90, x2: 32, y2: 210, lx: 18, ly: 150 },
  { key: "sleeve", view: "front", chart: true, x1: 18, y1: 158, x2: 42, y2: 158, lx: 30, ly: 148 },
  { key: "neck", view: "front", chart: true, x1: 90, y1: 68, x2: 110, y2: 68, lx: 100, ly: 58 },
];

const LINES_BY_TYPE: Record<MeasurementTypeId, DiagramLine[]> = {
  blouse: BLOUSE_LINES,
  dress: DRESS_LINES,
  child: CHILD_LINES,
};

export function attachLetters(type: MeasurementTypeId, lines: DiagramLine[]): DiagramLine[] {
  return lines.map((line) => ({
    ...line,
    letter: line.letter ?? letterForField(type, line.key),
  }));
}

export function linesForTypeAndView(type: MeasurementTypeId, view: DiagramView): DiagramLine[] {
  return attachLetters(type, LINES_BY_TYPE[type]).filter((l) => l.view === view);
}

export function viewBoxForType(type: MeasurementTypeId) {
  return type === "blouse" ? BLOUSE_VIEWBOX : FIGURE_VIEWBOX;
}

export function viewsForType(type: MeasurementTypeId): readonly DiagramView[] {
  return MEASUREMENT_TYPE_CONFIG[type].views;
}

export function legendKeysForType(type: MeasurementTypeId) {
  return MEASUREMENT_TYPE_CONFIG[type].legendKeys;
}
