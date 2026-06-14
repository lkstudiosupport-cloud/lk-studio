"use client";

import Image from "next/image";
import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";
import { measurementIconPath } from "@/lib/measurement-icon-paths";

type Props = {
  measurementType: MeasurementTypeId;
  fieldKey: MeasurementFieldKey;
  active?: boolean;
  className?: string;
};

export function MeasurementFieldGuide({ measurementType, fieldKey, active, className }: Props) {
  const src = measurementIconPath(measurementType, fieldKey);
  const sizeClass = className ?? "h-20 w-16 shrink-0";

  return (
    <Image
      src={src}
      alt=""
      width={156}
      height={104}
      className={`${sizeClass} rounded-md border border-zinc-200/80 bg-white object-contain shadow-sm ${
        active ? "ring-2 ring-zinc-800/30 ring-offset-1" : ""
      }`}
      aria-hidden
      unoptimized
    />
  );
}
