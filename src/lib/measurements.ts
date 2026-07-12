import type { ServiceCategory } from "@prisma/client";

export const MEASUREMENT_TYPES = ["blouse", "dress", "child"] as const;
export type MeasurementTypeId = (typeof MEASUREMENT_TYPES)[number];

export type MeasurementFieldKey =
  | "shoulder"
  | "armHole"
  | "bust"
  | "overBust"
  | "underBust"
  | "chest"
  | "waist"
  | "hip"
  | "highHip"
  | "backWaist"
  | "frontWaist"
  | "inseam"
  | "trouserThreeQuarter"
  | "blouseLen"
  | "length"
  | "neckToAboveKnee"
  | "aboveKneeToAnkle"
  | "armLength"
  | "bicep"
  | "foreArm"
  | "wrist"
  | "sleeve"
  | "neck"
  | "frontNeck"
  | "backNeck"
  | "slit"
  | "custom";

export type MeasurementFieldDef = { key: MeasurementFieldKey; letter?: string };

export type MeasurementTypeConfig = {
  id: MeasurementTypeId;
  prismaType: "BLOUSE" | "DRESS" | "CHILD";
  views: readonly ("front" | "side" | "back")[];
  fields: readonly MeasurementFieldDef[];
  legendKeys: readonly MeasurementFieldKey[];
  diagramTitleKey: string;
  diagramHintKey: string;
};

const BLOUSE_FIELDS: MeasurementFieldDef[] = [
  { key: "length", letter: "1" },
  { key: "bust", letter: "2" },
  { key: "underBust", letter: "3" },
  { key: "waist", letter: "4" },
  { key: "armLength", letter: "5" },
  { key: "bicep", letter: "6" },
  { key: "armHole", letter: "7" },
  { key: "frontNeck", letter: "8" },
  { key: "backNeck", letter: "9" },
  { key: "shoulder", letter: "10" },
];

/** Dress / kurti — 9 classic tailoring measurements (reference chart style) */
const DRESS_FIELDS: MeasurementFieldDef[] = [
  { key: "length", letter: "1" },
  { key: "bust", letter: "2" },
  { key: "underBust", letter: "3" },
  { key: "waist", letter: "4" },
  { key: "armLength", letter: "5" },
  { key: "wrist", letter: "6" },
  { key: "bicep", letter: "7" },
  { key: "frontNeck", letter: "8" },
  { key: "backNeck", letter: "9" },
  { key: "custom" },
];

const CHILD_FIELDS: MeasurementFieldDef[] = [
  { key: "length", letter: "1" },
  { key: "chest", letter: "2" },
  { key: "waist", letter: "3" },
  { key: "hip", letter: "4" },
  { key: "shoulder", letter: "5" },
  { key: "armHole", letter: "6" },
  { key: "armLength", letter: "7" },
  { key: "neck", letter: "8" },
  { key: "blouseLen", letter: "9" },
  { key: "trouserThreeQuarter", letter: "10" },
  { key: "custom" },
];

export const MEASUREMENT_TYPE_CONFIG: Record<MeasurementTypeId, MeasurementTypeConfig> = {
  blouse: {
    id: "blouse",
    prismaType: "BLOUSE",
    views: ["front", "back"],
    fields: BLOUSE_FIELDS,
    legendKeys: BLOUSE_FIELDS.filter((f) => f.letter).map((f) => f.key),
    diagramTitleKey: "blouseMeasurementChart",
    diagramHintKey: "blouseMeasurementHint",
  },
  dress: {
    id: "dress",
    prismaType: "DRESS",
    views: ["front", "back"],
    fields: DRESS_FIELDS,
    legendKeys: DRESS_FIELDS.filter((f) => f.letter).map((f) => f.key),
    diagramTitleKey: "dressMeasurementChart",
    diagramHintKey: "dressMeasurementHint",
  },
  child: {
    id: "child",
    prismaType: "CHILD",
    views: ["side", "front"],
    fields: CHILD_FIELDS,
    legendKeys: CHILD_FIELDS.filter((f) => f.letter).map((f) => f.key),
    diagramTitleKey: "childMeasurementChart",
    diagramHintKey: "childMeasurementHint",
  },
};

export const ALL_MEASUREMENT_FIELD_KEYS: MeasurementFieldKey[] = [
  "shoulder",
  "armHole",
  "bust",
  "overBust",
  "underBust",
  "chest",
  "waist",
  "hip",
  "highHip",
  "backWaist",
  "frontWaist",
  "inseam",
  "trouserThreeQuarter",
  "blouseLen",
  "length",
  "neckToAboveKnee",
  "aboveKneeToAnkle",
  "armLength",
  "bicep",
  "foreArm",
  "wrist",
  "sleeve",
  "neck",
  "frontNeck",
  "backNeck",
  "slit",
  "custom",
];

export function fieldsForType(type: MeasurementTypeId): MeasurementFieldDef[] {
  return [...MEASUREMENT_TYPE_CONFIG[type].fields];
}

export function fieldKeysForType(type: MeasurementTypeId): MeasurementFieldKey[] {
  return fieldsForType(type).map((f) => f.key);
}

export function letterForField(type: MeasurementTypeId, key: MeasurementFieldKey): string | undefined {
  return MEASUREMENT_TYPE_CONFIG[type].fields.find((f) => f.key === key)?.letter;
}

export function prismaTypeToId(type: string): MeasurementTypeId {
  if (type === "DRESS") return "dress";
  if (type === "CHILD") return "child";
  return "blouse";
}

export function idToPrismaType(id: MeasurementTypeId): "BLOUSE" | "DRESS" | "CHILD" {
  return MEASUREMENT_TYPE_CONFIG[id].prismaType;
}

export function measurementTypeForCategory(category: ServiceCategory): MeasurementTypeId {
  if (category === "DRESS_MODEL") return "dress";
  if (category === "CHILDREN_WEAR") return "child";
  return "blouse";
}

export type MeasurementRecord = Partial<Record<MeasurementFieldKey, string | null>>;

export type SavedMeasurement = MeasurementRecord & {
  type?: string;
};

export function measurementEntries(
  m: MeasurementRecord | null | undefined,
  type: MeasurementTypeId = "blouse"
) {
  if (!m) return [];
  return fieldsForType(type)
    .map((f) => ({
      key: f.key,
      value: m[f.key]?.trim() || "—",
      filled: Boolean(m[f.key]?.trim()),
    }))
    .filter((e) => e.filled);
}

export function pickMeasurementForType(
  measurements: SavedMeasurement[] | null | undefined,
  type: MeasurementTypeId
): MeasurementRecord | null {
  if (!measurements?.length) return null;
  const prismaType = idToPrismaType(type);
  const row = measurements.find((m) => m.type === prismaType || m.type === type);
  return row ?? null;
}

export const STITCH_TYPES = [
  "maggam",
  "computer_embroidery",
  "blouse_design",
  "plain",
  "designer",
  "custom",
] as const;

export const MEASUREMENT_FIELDS = ALL_MEASUREMENT_FIELD_KEYS.map((key) => ({ key, group: "legacy" }));
export const MEASUREMENT_FIELD_KEYS = ALL_MEASUREMENT_FIELD_KEYS;
