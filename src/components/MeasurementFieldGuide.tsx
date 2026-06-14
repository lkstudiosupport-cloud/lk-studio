"use client";

import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";
import { GUIDE_VIEWBOX, MEASUREMENT_TYPE_THEMES } from "@/lib/measurement-field-guide";
import { renderMeasurementFieldScene } from "@/lib/measurement-field-scenes";

type Props = {
  measurementType: MeasurementTypeId;
  fieldKey: MeasurementFieldKey;
  active?: boolean;
  className?: string;
};

export function MeasurementFieldGuide({ measurementType, fieldKey, active, className }: Props) {
  const theme = MEASUREMENT_TYPE_THEMES[measurementType];

  return (
    <svg
      viewBox={`0 0 ${GUIDE_VIEWBOX.w} ${GUIDE_VIEWBOX.h}`}
      className={className ?? "h-20 w-16 shrink-0"}
      aria-hidden
    >
      <rect
        width={GUIDE_VIEWBOX.w}
        height={GUIDE_VIEWBOX.h}
        rx="6"
        fill={theme.figureFill}
        stroke={theme.figureStroke}
        strokeWidth="0.6"
        opacity="0.95"
      />
      <g strokeLinecap="round" strokeLinejoin="round">
        {renderMeasurementFieldScene(measurementType, fieldKey, active)}
      </g>
    </svg>
  );
}
