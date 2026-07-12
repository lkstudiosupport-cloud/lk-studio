import {
  fieldsForType,
  MEASUREMENT_TYPES,
  type MeasurementFieldKey,
  type MeasurementRecord,
  type MeasurementTypeId,
} from "@/lib/measurements";

export type ShopMeasurementsData = {
  type: MeasurementTypeId;
  personName?: string;
  fields: Partial<Record<MeasurementFieldKey, string>>;
};

export function normalizeMeasurementTypeId(raw: string | null | undefined): MeasurementTypeId {
  const value = raw?.trim().toLowerCase();
  if (value === "dress" || value === "child") return "dress";
  return "blouse";
}

export function parseShopMeasurementsJson(raw: string | null | undefined): ShopMeasurementsData | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as ShopMeasurementsData;
    if (!parsed?.fields) return null;
    const type = normalizeMeasurementTypeId(parsed.type);
    if (!MEASUREMENT_TYPES.includes(type)) return null;
    return { ...parsed, type };
  } catch {
    return null;
  }
}

export function shopMeasurementsToRecord(data: ShopMeasurementsData): MeasurementRecord {
  return data.fields as MeasurementRecord;
}

export function parseShopMeasurementsFromForm(formData: FormData): ShopMeasurementsData | null {
  const raw = String(formData.get("shopMeasurementsJson") ?? "").trim();
  if (raw) {
    const parsed = parseShopMeasurementsJson(raw);
    if (parsed && Object.values(parsed.fields).some((v) => typeof v === "string" && v.trim())) {
      return parsed;
    }
  }

  const typeRaw = String(formData.get("shopMeasurementType") ?? "").trim();
  const type = (typeRaw || "blouse") as MeasurementTypeId;
  const personName = String(formData.get("shopMeasurementPersonName") ?? "").trim() || undefined;
  const fields: Partial<Record<MeasurementFieldKey, string>> = {};

  for (const f of fieldsForType(type)) {
    const v = String(formData.get(`shopMeas_${f.key}`) ?? "").trim();
    if (v) fields[f.key] = v;
  }

  const hasValue = Object.keys(fields).length > 0;
  if (!hasValue) return null;

  return { type, ...(personName ? { personName } : {}), fields };
}

export function buildShopMeasurementsJson(
  type: MeasurementTypeId,
  fields: Partial<Record<MeasurementFieldKey, string>>,
  personName?: string
): string {
  const cleaned: Partial<Record<MeasurementFieldKey, string>> = {};
  for (const f of fieldsForType(type)) {
    const v = fields[f.key]?.trim();
    if (v) cleaned[f.key] = v;
  }
  return JSON.stringify({
    type,
    ...(personName?.trim() ? { personName: personName.trim() } : {}),
    fields: cleaned,
  } satisfies ShopMeasurementsData);
}

export type LastMeasurementSnapshot =
  | { mode: "view"; personId: string; viewMeasureType: MeasurementTypeId }
  | { mode: "manual"; data: ShopMeasurementsData };

import type { Measurement, ServiceCategory } from "@prisma/client";

export function serviceCategoryFromMeasurementType(type: MeasurementTypeId): ServiceCategory {
  if (type === "dress") return "DRESS_MODEL";
  return "BLOUSE_DESIGN";
}

/** Pick order category from reference designs or garment measurements — never a random default. */
export function inferOrderCategoryFromMeasurements(
  orderedDesigns: { category: ServiceCategory }[],
  shopMeasurements: { type: MeasurementTypeId } | null,
  personMeasurements: Pick<Measurement, "type">[] | null
): ServiceCategory {
  if (orderedDesigns.length > 0) return orderedDesigns[0]!.category;
  if (shopMeasurements?.type) return serviceCategoryFromMeasurementType(shopMeasurements.type);
  if (personMeasurements?.length) {
    const types = new Set(personMeasurements.map((m) => m.type));
    if (types.has("DRESS")) return "DRESS_MODEL";
    if (types.has("CHILD")) return "CHILDREN_WEAR";
    if (types.has("BLOUSE")) return "BLOUSE_DESIGN";
  }
  return "STITCHED_DESIGNS";
}

export function captureMeasurementSnapshot(
  formData: FormData,
  clientMode: "view" | "manual",
  personId: string,
  viewMeasureType: MeasurementTypeId
): LastMeasurementSnapshot | null {
  const mode = String(formData.get("measurementMode") ?? clientMode);
  if (mode === "view") {
    const pid = String(formData.get("personId") ?? personId).trim();
    if (!pid) return null;
    return { mode: "view", personId: pid, viewMeasureType };
  }
  const manual = parseShopMeasurementsFromForm(formData);
  if (manual) return { mode: "manual", data: manual };
  const pid = String(formData.get("personId") ?? personId).trim();
  if (pid) return { mode: "view", personId: pid, viewMeasureType };
  return null;
}
