"use client";

import { useId } from "react";
import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";
import {
  GUIDE_VIEWBOX,
  guideOverlayForField,
  MEASUREMENT_TYPE_THEMES,
  type GuideView,
} from "@/lib/measurement-field-guide";

const STROKE = "#141414";
const SW = 1.1;

function MiniBlouseFront() {
  return (
    <>
      <path d="M 28 14 L 28 20 L 44 20 L 44 14" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 28 20 L 16 26" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 44 20 L 56 26" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M 16 26 C 12 32 10 40 10 48 C 10 56 12 62 14 68"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 56 26 C 60 32 62 40 62 48 C 62 56 60 62 58 68"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 16 26 C 14 34 14 42 16 50 C 18 58 22 66 26 72 C 28 76 32 78 36 78 C 40 78 44 76 46 72 C 50 66 54 58 56 50 C 58 42 58 34 56 26"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </>
  );
}

function MiniBlouseBack() {
  return (
    <>
      <path d="M 30 14 Q 36 17 42 14" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 28 18 L 16 26" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 44 18 L 56 26" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M 16 26 C 14 34 14 42 16 50 C 18 58 22 66 26 72 C 28 76 32 78 36 78 C 40 78 44 76 46 72 C 50 66 54 58 56 50 C 58 42 58 34 56 26"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M 12 48 C 10 56 12 62 14 68" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 60 48 C 62 56 60 62 58 68" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </>
  );
}

function MiniDressFront() {
  return (
    <>
      <ellipse cx="36" cy="12" rx="6" ry="7" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 30 18 L 30 22 L 42 22 L 42 18" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 30 22 L 16 28" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 42 22 L 56 28" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M 16 28 C 10 36 8 48 10 60 C 12 72 16 82 22 90 L 36 94 L 50 90 C 56 82 60 72 62 60 C 64 48 62 36 56 28"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M 10 52 L 4 64 L 2 76 L 4 86" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 62 52 L 68 64 L 70 76 L 68 86" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 32 94 L 30 104 M 40 94 L 42 104" stroke={STROKE} strokeWidth={0.9} opacity="0.45" />
    </>
  );
}

function MiniChildFront() {
  return (
    <>
      <circle cx="36" cy="14" r="7" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 30 20 L 30 24 L 42 24 L 42 20" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 30 24 L 18 30" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 42 24 L 54 30" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M 18 30 C 14 40 14 52 16 64 C 18 76 22 86 28 94 C 32 98 36 100 36 100 C 36 100 40 98 44 94 C 50 86 54 76 56 64 C 58 52 58 40 54 30"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M 16 64 L 10 76 L 8 86" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 56 64 L 62 76 L 64 86" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 34 100 L 32 110 M 38 100 L 40 110" stroke={STROKE} strokeWidth={0.9} opacity="0.45" />
    </>
  );
}

function MiniSideBody() {
  return (
    <>
      <path
        d="M 44 8 C 48 8 50 12 48 16 L 50 18"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 50 18 C 54 22 56 28 54 34 C 52 42 48 50 44 58 C 40 66 36 74 34 82 L 38 84 L 42 82"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M 52 26 C 48 36 44 48 40 60 C 36 72 34 80 32 86"
        fill="none"
        stroke={STROKE}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity="0.5"
      />
    </>
  );
}

function MiniFigure({ type, view }: { type: MeasurementTypeId; view: GuideView }) {
  if (view === "side") return <MiniSideBody />;
  if (view === "back") return <MiniBlouseBack />;
  if (type === "blouse") return <MiniBlouseFront />;
  if (type === "child") return <MiniChildFront />;
  return <MiniDressFront />;
}

type Props = {
  measurementType: MeasurementTypeId;
  fieldKey: MeasurementFieldKey;
  active?: boolean;
  className?: string;
};

export function MeasurementFieldGuide({ measurementType, fieldKey, active, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const theme = MEASUREMENT_TYPE_THEMES[measurementType];
  const overlay = guideOverlayForField(measurementType, fieldKey);
  const line = overlay.line;

  return (
    <svg
      viewBox={`0 0 ${GUIDE_VIEWBOX.w} ${GUIDE_VIEWBOX.h}`}
      className={className ?? "h-16 w-12 shrink-0"}
      aria-hidden
    >
      <defs>
        <marker id={`guideArrow-${uid}`} markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#141414" />
        </marker>
      </defs>
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
        <MiniFigure type={measurementType} view={overlay.view} />
        {line && (
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#141414"
            strokeWidth={active ? 2 : 1.4}
            markerEnd={`url(#guideArrow-${uid})`}
          />
        )}
      </g>
    </svg>
  );
}
