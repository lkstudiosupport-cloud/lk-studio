"use client";

import { useId } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { MeasurementFieldKey, MeasurementRecord } from "@/lib/measurements";
import {
  DRESS_CHART_LINES,
  DRESS_CHART_VIEWBOX,
  DressChartDefs,
  DressMannequinFigure,
  type DressDiagramLine,
} from "./DressMeasurementChart";

const NAVY = "#1e3a5f";
const PINK = "#db2777";
const GREEN = "#16a34a";

function NumBadge({ x, y, num, active }: { x: number; y: number; num: string; active: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r="9" fill={active ? "#fbbf24" : NAVY} stroke="#fff" strokeWidth="1" />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">
        {num}
      </text>
    </g>
  );
}

function DressMeasureLine({
  line,
  uid,
  isActive,
  hasValue,
  dimmed,
  value,
}: {
  line: DressDiagramLine;
  uid: string;
  isActive: boolean;
  hasValue: boolean;
  dimmed: boolean;
  value?: string;
}) {
  const emphasized = isActive || hasValue;
  if (!emphasized && dimmed) return null;

  const stroke =
    emphasized
      ? line.kind === "horizontal"
        ? GREEN
        : PINK
      : line.kind === "horizontal"
        ? "#86efac"
        : "#f9a8d4";

  const opacity = !emphasized && !dimmed ? 0.5 : 1;
  const dash = line.kind === "horizontal" && !emphasized ? "5 4" : undefined;

  return (
    <g opacity={opacity}>
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={stroke}
        strokeWidth={isActive ? 2.4 : hasValue ? 2 : 1.3}
        strokeDasharray={dash}
        markerEnd={line.kind !== "horizontal" || emphasized ? `url(#dressArrow-${uid})` : undefined}
        markerStart={emphasized ? `url(#dressArrowStart-${uid})` : undefined}
        filter={isActive ? `url(#dressGlow-${uid})` : undefined}
      />
      {(emphasized || !dimmed) && <NumBadge x={line.lx} y={line.ly} num={line.num} active={emphasized} />}
      {hasValue && value && (
        <g>
          <rect x={line.lx - 14} y={line.ly + 10} width="28" height="11" rx="3" fill={stroke} />
          <text x={line.lx} y={line.ly + 18} textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">
            {value}&quot;
          </text>
        </g>
      )}
    </g>
  );
}

function DressMeasureTips({ locale }: { locale: Locale }) {
  const tips = ["dressTip1", "dressTip2", "dressTip3", "dressTip4"] as const;
  return (
    <div className="mt-3 rounded-lg border border-pink-100 bg-pink-50/60 px-3 py-2">
      <p className="mb-1.5 text-xs font-bold uppercase text-pink-800">{t(locale, "dressMeasureTips")}</p>
      <ul className="grid gap-1 sm:grid-cols-2">
        {tips.map((key) => (
          <li key={key} className="text-xs leading-snug text-pink-900/80">
            • {t(locale, key)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DressMeasurementDiagram({
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

  return (
    <div className="dress-measurement-diagram w-full min-w-0 max-w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-green">
          {t(locale, "dressMeasurementChart")}
        </p>
        {filledCount > 0 && (
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-800">
            {filledCount}/{totalFields}
          </span>
        )}
      </div>

      <p className="mb-3 text-[11px] leading-snug text-zinc-600">{t(locale, "dressMeasurementHint")}</p>

      <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-pink-50/30 p-3 shadow-sm">
        <div className="flex justify-center">
          <div className="relative w-full max-w-[320px]">
            <svg
              viewBox={`0 0 ${DRESS_CHART_VIEWBOX.w} ${DRESS_CHART_VIEWBOX.h}`}
              className="h-auto w-full rounded-lg bg-white shadow-inner"
              aria-hidden
            >
              <DressChartDefs uid={uid} />
              <rect width={DRESS_CHART_VIEWBOX.w} height={DRESS_CHART_VIEWBOX.h} fill="#fffafb" rx="8" />
              <DressMannequinFigure uid={uid} />
              <g className="dress-measure-lines">
                {DRESS_CHART_LINES.map((line) => (
                  <DressMeasureLine
                    key={line.key}
                    line={line}
                    uid={uid}
                    isActive={activeField === line.key}
                    hasValue={Boolean(measurement?.[line.key]?.trim())}
                    dimmed={hasFocus}
                    value={measurement?.[line.key]?.trim()}
                  />
                ))}
              </g>
            </svg>
            <p className="mt-2 text-center text-[9px] text-zinc-400">{t(locale, "measurementsInInches")}</p>
          </div>
        </div>
        <DressMeasureTips locale={locale} />
      </div>
    </div>
  );
}
