"use client";

import { useCallback, useId, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { MeasurementFieldKey, MeasurementRecord } from "@/lib/measurements";
import { MEASUREMENT_ACTIVE_COLORS } from "@/lib/measurement-diagram";
import {
  BLOUSE_CHART_LINES_BACK,
  BLOUSE_CHART_LINES_FRONT,
  BLOUSE_CHART_VIEWBOX,
  BlouseChartDefs,
  BlouseMannequinBack,
  BlouseMannequinFront,
  BlouseMannequinSideLeft,
  BlouseMannequinSideRight,
  type BlouseDiagramLine,
} from "./BlouseMeasurementChart";

function viewFromRotation(deg: number): "front" | "back" | "side" {
  const n = ((deg % 360) + 360) % 360;
  if (n < 45 || n >= 315) return "front";
  if (n >= 135 && n < 225) return "back";
  return "side";
}

function snapRotation(deg: number): number {
  const n = ((deg % 360) + 360) % 360;
  const targets = [0, 90, 180, 270];
  let best = targets[0];
  let bestDist = 360;
  for (const t of targets) {
    const d = Math.min(Math.abs(n - t), 360 - Math.abs(n - t));
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
}

function NumBadge({ x, y, num, active }: { x: number; y: number; num: string; active: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill={active ? "#fbbf24" : "#ffffff"} stroke="#0f172a" strokeWidth="1.4" />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">
        {num}
      </text>
    </g>
  );
}

function BlouseMeasureLine({
  line,
  uid,
  isActive,
  hasValue,
  dimmed,
  value,
}: {
  line: BlouseDiagramLine;
  uid: string;
  isActive: boolean;
  hasValue: boolean;
  dimmed: boolean;
  value?: string;
}) {
  const emphasized = isActive || hasValue;
  if (!emphasized && dimmed) return null;

  const color = emphasized ? (MEASUREMENT_ACTIVE_COLORS[line.key] ?? "#be123c") : "#1e293b";
  const opacity = !emphasized && !dimmed ? 0.42 : 1;

  return (
    <g opacity={opacity}>
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={color}
        strokeWidth={isActive ? 2.6 : hasValue ? 2.1 : 1.5}
        markerEnd={`url(#blouseArrow-${uid})`}
        markerStart={`url(#blouseArrowStart-${uid})`}
        filter={isActive ? `url(#blouseLineGlow-${uid})` : undefined}
      />
      {(emphasized || !dimmed) && <NumBadge x={line.lx} y={line.ly} num={line.num} active={emphasized} />}
      {hasValue && value && (
        <g>
          <rect x={line.lx - 16} y={line.ly + 14} width="32" height="13" rx="4" fill={color} />
          <text x={line.lx} y={line.ly + 24} textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">
            {value}&quot;
          </text>
        </g>
      )}
    </g>
  );
}

function BlouseSvgPanel({
  uid,
  side,
  measurement,
  activeField,
  hasFocus,
}: {
  uid: string;
  side: "front" | "back" | "left" | "right";
  measurement?: MeasurementRecord | null;
  activeField?: MeasurementFieldKey | null;
  hasFocus: boolean;
}) {
  const lines: BlouseDiagramLine[] =
    side === "front" ? BLOUSE_CHART_LINES_FRONT : side === "back" ? BLOUSE_CHART_LINES_BACK : [];
  const showLines = side === "front" || side === "back";

  return (
    <svg viewBox={`0 0 ${BLOUSE_CHART_VIEWBOX.w} ${BLOUSE_CHART_VIEWBOX.h}`} className="h-full w-full" aria-hidden>
      <BlouseChartDefs uid={uid} />
      <defs>
        <marker id={`blouseArrowStart-${uid}`} markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <path d="M7,0 L0,3.5 L7,7 Z" fill="#0f172a" />
        </marker>
      </defs>
      <rect width={BLOUSE_CHART_VIEWBOX.w} height={BLOUSE_CHART_VIEWBOX.h} fill={`url(#studioLight-${uid})`} />
      <rect width={BLOUSE_CHART_VIEWBOX.w} height={BLOUSE_CHART_VIEWBOX.h} fill="#f5f5f4" opacity="0.45" />
      {side === "front" && <BlouseMannequinFront uid={uid} />}
      {side === "back" && <BlouseMannequinBack uid={uid} />}
      {side === "left" && <BlouseMannequinSideLeft uid={uid} />}
      {side === "right" && <BlouseMannequinSideRight uid={uid} />}
      {showLines && (
        <g className="blouse-measure-lines">
          {lines.map((line) => (
            <BlouseMeasureLine
              key={`${side}-${line.key}`}
              line={line}
              uid={uid}
              isActive={activeField === line.key}
              hasValue={Boolean(measurement?.[line.key]?.trim())}
              dimmed={hasFocus}
              value={measurement?.[line.key]?.trim()}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

export function BlouseMeasurementDiagram({
  locale,
  measurement,
  activeField,
  filledCount,
  totalFields,
}: {
  locale: Locale;
  measurement?: MeasurementRecord | null;
  activeField?: MeasurementFieldKey | null;
  filledCount: number;
  totalFields: number;
}) {
  const uid = useId().replace(/:/g, "");
  const hasFocus = Boolean(activeField);
  const [rotation, setRotation] = useState(0);
  const dragRef = useRef<{ startX: number; startRot: number } | null>(null);

  const displayView = viewFromRotation(rotation);
  const viewLabel =
    displayView === "front"
      ? t(locale, "measurementFront")
      : displayView === "back"
        ? t(locale, "measurementBack")
        : t(locale, "measurementSide");

  const goFront = () => setRotation(0);
  const goBack = () => setRotation(180);

  const setRotationClamped = useCallback((deg: number) => {
    setRotation(((deg % 360) + 360) % 360);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startRot: rotation };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    setRotationClamped(dragRef.current.startRot + dx * 0.45);
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setRotation((r) => snapRotation(r));
  };

  const rotateBy = (delta: number) => {
    setRotation((r) => snapRotation(r + delta));
  };

  return (
    <div className="blouse-measurement-diagram w-full min-w-0 max-w-full overflow-x-clip">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-green">
          {t(locale, "blouseMeasurementChart")}
        </p>
        {filledCount > 0 && (
          <span className="rounded-full bg-brand-gold/25 px-2 py-0.5 text-[10px] font-bold text-brand-green">
            {filledCount}/{totalFields}
          </span>
        )}
      </div>

      <p className="mb-2 text-[11px] leading-snug text-zinc-600">{t(locale, "blouseMeasurementHint3d")}</p>

      <div className="rounded-xl border border-zinc-200 bg-gradient-to-b from-stone-100 via-white to-stone-50 p-3 shadow-md">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-1">
            <button
              type="button"
              onClick={() => rotateBy(-90)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-green shadow ring-1 ring-zinc-200 hover:bg-brand-cream"
              aria-label={t(locale, "rotateLeft")}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => rotateBy(90)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-green shadow ring-1 ring-zinc-200 hover:bg-brand-cream"
              aria-label={t(locale, "rotateRight")}
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goFront}
              className="rounded-lg bg-white px-2 py-1 text-[9px] font-bold uppercase text-brand-green shadow ring-1 ring-zinc-200 hover:bg-brand-cream"
            >
              {t(locale, "measurementFront")}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg bg-white px-2 py-1 text-[9px] font-bold uppercase text-brand-green shadow ring-1 ring-zinc-200 hover:bg-brand-cream"
            >
              {t(locale, "measurementBack")}
            </button>
          </div>
          <span className="rounded-full bg-brand-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">
            {viewLabel}
          </span>
        </div>

        <div className="flex justify-center">
          <div
            className="mannequin-3d-stage relative aspect-[13/17] w-full max-w-full cursor-grab touch-none active:cursor-grabbing sm:max-w-[340px]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <div className="mannequin-3d-cube h-full w-full" style={{ transform: `rotateX(-5deg) rotateY(${rotation}deg)` }}>
              <div className="mannequin-3d-face mannequin-3d-face-front">
                <BlouseSvgPanel
                  uid={`${uid}-f`}
                  side="front"
                  measurement={measurement}
                  activeField={activeField}
                  hasFocus={hasFocus}
                />
              </div>
              <div className="mannequin-3d-face mannequin-3d-face-back">
                <BlouseSvgPanel
                  uid={`${uid}-b`}
                  side="back"
                  measurement={measurement}
                  activeField={activeField}
                  hasFocus={hasFocus}
                />
              </div>
              <div className="mannequin-3d-face mannequin-3d-face-left">
                <BlouseSvgPanel uid={`${uid}-l`} side="left" measurement={measurement} activeField={activeField} hasFocus={hasFocus} />
              </div>
              <div className="mannequin-3d-face mannequin-3d-face-right">
                <BlouseSvgPanel uid={`${uid}-r`} side="right" measurement={measurement} activeField={activeField} hasFocus={hasFocus} />
              </div>
            </div>
            <div className="mannequin-3d-floor-shadow" aria-hidden />
            <p className="pointer-events-none absolute bottom-1 left-0 right-0 text-center text-[9px] text-zinc-400">
              {t(locale, "dragToRotate")} · {t(locale, "measurementsInInches")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
