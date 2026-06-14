import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";

/** Public URL for a reference-style measurement field icon PNG. */
export function measurementIconPath(
  type: MeasurementTypeId,
  fieldKey: MeasurementFieldKey
): string {
  return `/measurement-icons/${type}/${fieldKey}.png`;
}
