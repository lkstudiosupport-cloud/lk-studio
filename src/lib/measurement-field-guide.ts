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
  length: { view: "front", line: v(36, 14, 90) },
  bust: { view: "front", line: h(34, 18, 54) },
  underBust: { view: "front", line: h(40, 20, 52) },
  waist: { view: "front", line: h(48, 22, 50) },
  armLength: { view: "front", line: v(10, 24, 68) },
  bicep: { view: "front", line: h(38, 6, 12) },
  armHole: { view: "front", line: h(28, 16, 56) },
  frontNeck: { view: "front", line: { x1: 38, y1: 18, x2: 36, y2: 28 } },
  backNeck: { view: "back", line: h(18, 30, 42) },
  shoulder: { view: "front", line: h(22, 14, 58) },
};

const DRESS_GUIDES: Partial<Record<MeasurementFieldKey, GuideOverlay>> = {
  length: { view: "front", line: v(36, 14, 90) },
  bust: { view: "front", line: h(34, 18, 54) },
  underBust: { view: "front", line: h(40, 20, 52) },
  waist: { view: "front", line: h(50, 22, 50) },
  armLength: { view: "front", line: v(8, 22, 58) },
  wrist: { view: "front", line: h(56, 6, 12) },
  bicep: { view: "front", line: h(38, 6, 12) },
  frontNeck: { view: "front", line: { x1: 38, y1: 18, x2: 36, y2: 28 } },
  backNeck: { view: "back", line: h(18, 30, 42) },
  custom: { view: "front" },
};

const GUIDES_BY_TYPE: Record<MeasurementTypeId, Partial<Record<MeasurementFieldKey, GuideOverlay>>> = {
  blouse: BLOUSE_GUIDES,
  dress: DRESS_GUIDES,
};

export function guideOverlayForField(
  type: MeasurementTypeId,
  field: MeasurementFieldKey
): GuideOverlay {
  return GUIDES_BY_TYPE[type][field] ?? { view: "front" };
}
