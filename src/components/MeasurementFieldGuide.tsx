"use client";

import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";
import { measurementIconPath } from "@/lib/measurement-icon-paths";

type Props = {
  measurementType: MeasurementTypeId;
  fieldKey: MeasurementFieldKey;
  active?: boolean;
  className?: string;
};

/** Reference screenshot icons — 92×58 aspect white cards with figure + measurement line. */
export function MeasurementFieldGuide({ measurementType, fieldKey, active, className }: Props) {
  const src = measurementIconPath(measurementType, fieldKey);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={92}
      height={58}
      className={
        className ??
        "h-[58px] w-[92px] shrink-0 rounded-lg border border-zinc-200/90 bg-white object-contain shadow-sm"
      }
      style={active ? { outline: "2px solid rgba(24,24,27,0.35)", outlineOffset: 2 } : undefined}
      aria-hidden
      loading="lazy"
      decoding="async"
    />
  );
}
