import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";

/** Bump when icons are regenerated so browsers fetch fresh PNGs. */
export const MEASUREMENT_ICON_VERSION = "6";

/** Public URL for a reference-style measurement field icon PNG. */
export function measurementIconPath(
  type: MeasurementTypeId,
  fieldKey: MeasurementFieldKey
): string {
  return `/measurement-icons/${type}/${fieldKey}.png?v=${MEASUREMENT_ICON_VERSION}`;
}
