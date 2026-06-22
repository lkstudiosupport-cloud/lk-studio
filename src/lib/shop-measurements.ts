import {
  fieldsForType,
  type MeasurementFieldKey,
  type MeasurementRecord,
  type MeasurementTypeId,
} from "@/lib/measurements";

export type ShopMeasurementsData = {
  type: MeasurementTypeId;
  personName?: string;
  fields: Partial<Record<MeasurementFieldKey, string>>;
};

export function parseShopMeasurementsJson(raw: string | null | undefined): ShopMeasurementsData | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as ShopMeasurementsData;
    if (!parsed?.type || !parsed.fields) return null;
    return parsed;
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
