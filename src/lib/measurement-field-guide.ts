import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";

export const GUIDE_VIEWBOX = { w: 72, h: 96 };

export type GuideView = "front" | "side" | "back";

export type GuideLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type GuideOverlay = {
  view: GuideView;
  line?: GuideLine;
};

export type MeasurementTypeTheme = {
  figureFill: string;
  figureStroke: string;
  rowBorder: string;
  rowBg: string;
  rowActiveBg: string;
  accent: string;
};

export const MEASUREMENT_TYPE_THEMES: Record<MeasurementTypeId, MeasurementTypeTheme> = {
  blouse: {
    figureFill: "#fdf2f8",
    figureStroke: "#9d174d",
    rowBorder: "border-rose-200",
    rowBg: "bg-rose-50/60",
    rowActiveBg: "bg-rose-100/80",
    accent: "text-rose-800",
  },
  dress: {
    figureFill: "#f0fdfa",
    figureStroke: "#0f766e",
    rowBorder: "border-teal-200",
    rowBg: "bg-teal-50/60",
    rowActiveBg: "bg-teal-100/80",
    accent: "text-teal-800",
  },
  child: {
    figureFill: "#eff6ff",
    figureStroke: "#1d4ed8",
    rowBorder: "border-blue-200",
    rowBg: "bg-blue-50/60",
    rowActiveBg: "bg-blue-100/80",
    accent: "text-blue-800",
  },
};

/** Circumference measurements shown with an "(All Around)" label suffix. */
export const CIRCUMFERENCE_FIELD_KEYS = new Set<MeasurementFieldKey>([
  "bust",
  "overBust",
  "underBust",
  "chest",
  "waist",
  "hip",
  "armHole",
  "sleeve",
  "bicep",
  "wrist",
  "neck",
]);

export function isCircumferenceField(key: MeasurementFieldKey): boolean {
  return CIRCUMFERENCE_FIELD_KEYS.has(key);
}

const h = (y: number, x1: number, x2: number): GuideLine => ({ x1, y1: y, x2, y2: y });
const v = (x: number, y1: number, y2: number): GuideLine => ({ x1: x, y1, x2: x, y2 });

const BLOUSE_GUIDES: Partial<Record<MeasurementFieldKey, GuideOverlay>> = {
  shoulder: { view: "front", line: h(22, 14, 58) },
  armHole: { view: "front", line: h(28, 16, 56) },
  chest: { view: "front", line: h(34, 20, 52) },
  waist: { view: "front", line: h(48, 22, 50) },
  blouseLen: { view: "front", line: v(36, 22, 78) },
  armLength: { view: "front", line: v(10, 24, 68) },
  sleeve: { view: "front", line: h(56, 6, 14) },
  custom: { view: "front" },
};

const DRESS_GUIDES: Partial<Record<MeasurementFieldKey, GuideOverlay>> = {
  neck: { view: "front", line: h(16, 30, 42) },
  overBust: { view: "front", line: h(28, 18, 54) },
  bust: { view: "front", line: h(34, 18, 54) },
  underBust: { view: "front", line: h(40, 20, 52) },
  waist: { view: "front", line: h(50, 22, 50) },
  hip: { view: "front", line: h(60, 20, 52) },
  length: { view: "front", line: v(36, 14, 90) },
  neckToAboveKnee: { view: "front", line: v(48, 14, 62) },
  aboveKneeToAnkle: { view: "front", line: v(48, 62, 90) },
  armLength: { view: "front", line: v(8, 22, 58) },
  shoulder: { view: "front", line: h(20, 14, 58) },
  armHole: { view: "front", line: h(26, 16, 56) },
  bicep: { view: "front", line: h(38, 6, 12) },
  foreArm: { view: "front", line: h(48, 6, 12) },
  wrist: { view: "front", line: h(56, 6, 12) },
  frontNeck: { view: "front", line: { x1: 38, y1: 18, x2: 36, y2: 28 } },
  frontWaist: { view: "front", line: v(24, 20, 50) },
  trouserThreeQuarter: { view: "front", line: v(40, 50, 78) },
  custom: { view: "front" },
};

const CHILD_GUIDES: Partial<Record<MeasurementFieldKey, GuideOverlay>> = {
  shoulder: { view: "front", line: h(24, 18, 54) },
  chest: { view: "front", line: h(32, 20, 52) },
  bust: { view: "front", line: h(38, 20, 52) },
  waist: { view: "front", line: h(48, 22, 50) },
  hip: { view: "front", line: h(56, 20, 52) },
  blouseLen: { view: "front", line: v(36, 24, 66) },
  length: { view: "front", line: v(28, 10, 88) },
  armLength: { view: "front", line: v(12, 24, 62) },
  sleeve: { view: "front", line: h(52, 8, 16) },
  neck: { view: "front", line: h(18, 30, 42) },
  custom: { view: "front" },
};

const GUIDES_BY_TYPE: Record<MeasurementTypeId, Partial<Record<MeasurementFieldKey, GuideOverlay>>> = {
  blouse: BLOUSE_GUIDES,
  dress: DRESS_GUIDES,
  child: CHILD_GUIDES,
};

export function guideOverlayForField(
  type: MeasurementTypeId,
  field: MeasurementFieldKey
): GuideOverlay {
  return GUIDES_BY_TYPE[type][field] ?? { view: "front" };
}
