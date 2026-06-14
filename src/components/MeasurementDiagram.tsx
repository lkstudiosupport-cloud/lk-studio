"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { MeasurementFieldKey, MeasurementRecord, MeasurementTypeId } from "@/lib/measurements";
import {
  fieldsForType,
  letterForField,
  MEASUREMENT_TYPE_CONFIG,
} from "@/lib/measurements";
import {
  type DiagramLine,
  type DiagramView,
  legendKeysForType,
  linesForTypeAndView,
  MEASUREMENT_ACTIVE_COLORS,
  viewBoxForType,
  viewsForType,
} from "@/lib/measurement-diagram";
import {
  SewingBodyFigureSvg,
  SewingChartBackground,
  SewingChartBackgroundDefs,
  SewingChartDefs,
} from "./SewingBodyFigureSvg";

function viewLabel(locale: Locale, view: DiagramView) {
  if (view === "side") return t(locale, "measurementSide");
  if (view === "back") return t(locale, "measurementBack");
  return t(locale, "measurementFront");
}

function LetterBadge({ x, y, letter, active }: { x: number; y: number; letter: string; active: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r="8" fill={active ? "#fbbf24" : "#ffffff"} stroke="#141414" strokeWidth="0.6" />
      <text x={x} y={y + 3.2} textAnchor="middle" fontSize="8" fontWeight="800" fill="#141414">
        {letter}
      </text>
    </g>
  );
}

function MeasureLine({
  line,
  uid,
  isActive,
  hasValue,
  dimmed,
  value,
}: {
  line: DiagramLine;
  uid: string;
  isActive: boolean;
  hasValue: boolean;
  dimmed: boolean;
  value?: string;
}) {
  const emphasized = isActive || hasValue;
  const visible = emphasized || !dimmed;
  if (!visible) return null;

  const color = emphasized ? (MEASUREMENT_ACTIVE_COLORS[line.key] ?? "#e11d48") : "#64748b";
  const opacity = !emphasized && !dimmed ? 0.45 : 1;

  return (
    <g className={isActive ? "measure-line-active" : hasValue ? "measure-line-filled" : "measure-line-idle"} opacity={opacity}>
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={color}
        strokeWidth={isActive ? 2.2 : hasValue ? 1.8 : 1.2}
        markerEnd={line.chart ? `url(#sewArrow-${uid})` : undefined}
        filter={isActive ? `url(#lineGlow-${uid})` : undefined}
      />
      {line.letter && (emphasized || !dimmed) && (
        <LetterBadge x={line.lx} y={line.ly} letter={line.letter} active={emphasized} />
      )}
      {hasValue && value && (
        <g className="measure-value-badge">
          <rect x={line.lx - 14} y={line.ly + 10} width="28" height="11" rx="3" fill={color} />
          <text x={line.lx} y={line.ly + 18.5} textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">
            {value}&quot;
          </text>
        </g>
      )}
    </g>
  );
}

function ViewPanel({
  view,
  measurementType,
  activeField,
  measurement,
}: {
  view: DiagramView;
  measurementType: MeasurementTypeId;
  activeField?: MeasurementFieldKey | null;
  measurement?: MeasurementRecord | null;
}) {
  const uid = useId().replace(/:/g, "");
  const lines = linesForTypeAndView(measurementType, view);
  const hasFocus = Boolean(activeField);
  const box = viewBoxForType(measurementType);

  return (
    <div className="line-art-mannequin-card relative mx-auto h-full w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <svg viewBox={`0 0 ${box.w} ${box.h}`} className="h-full w-full" aria-hidden>
        <SewingChartBackgroundDefs />
        <SewingChartDefs uid={uid} />
        <SewingChartBackground variant={measurementType} />
        <SewingBodyFigureSvg view={view} variant={measurementType} />
        <g className="measurement-lines-layer">
          {lines.map((line) => (
            <MeasureLine
              key={`${view}-${line.key}-${line.x1}`}
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
    </div>
  );
}

function ChartLegend({
  locale,
  measurementType,
  activeField,
}: {
  locale: Locale;
  measurementType: MeasurementTypeId;
  activeField?: MeasurementFieldKey | null;
}) {
  const keys = legendKeysForType(measurementType);
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs sm:grid-cols-3">
      {keys.map((key) => {
        const letter = letterForField(measurementType, key);
        const active = activeField === key;
        return (
          <div key={key} className={`flex items-center gap-1.5 ${active ? "text-brand-green" : "text-zinc-600"}`}>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold ${
                active ? "bg-brand-gold text-brand-green" : "bg-white text-zinc-800 ring-1 ring-zinc-200"
              }`}
            >
              {letter}
            </span>
            <span className="leading-tight">{t(locale, key)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function MeasurementDiagram({
  measurementType = "blouse",
  activeField,
  locale = "en",
  measurement,
  advanced = true,
}: {
  measurementType?: MeasurementTypeId;
  activeField?: MeasurementFieldKey | null;
  locale?: Locale;
  measurement?: MeasurementRecord | null;
  advanced?: boolean;
}) {
  const views = viewsForType(measurementType);
  const [mobileView, setMobileView] = useState<DiagramView>(views[0]);
  const config = MEASUREMENT_TYPE_CONFIG[measurementType];
  const typeFields = fieldsForType(measurementType);

  const filledCount = useMemo(
    () => (measurement ? typeFields.filter((f) => measurement[f.key]?.trim()).length : 0),
    [measurement, typeFields]
  );

  const aspectClass =
    measurementType === "blouse" ? "aspect-[2/3] max-h-[360px]" : "aspect-[10/21] max-h-[400px]";

  if (!advanced) {
    return (
      <div className="measurement-diagram-advanced mx-auto w-full max-w-[220px]">
        <ViewPanel view={views[0]} measurementType={measurementType} activeField={activeField} measurement={measurement} />
      </div>
    );
  }

  return (
    <div className="measurement-diagram-advanced w-full min-w-0 max-w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-green">{t(locale, config.diagramTitleKey)}</p>
        {filledCount > 0 && (
          <span className="rounded-full bg-brand-gold/25 px-2 py-0.5 text-xs font-bold text-brand-green">
            {filledCount}/{typeFields.length} {t(locale, "measurements")}
          </span>
        )}
      </div>

      <p className="mb-3 text-[11px] leading-snug text-zinc-600">{t(locale, config.diagramHintKey)}</p>

      {views.length > 1 && (
        <div className="mb-2 flex gap-1.5 lg:hidden">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMobileView(v)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                mobileView === v
                  ? "bg-brand-green text-white shadow-sm"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200"
              }`}
            >
              {viewLabel(locale, v)}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className={`grid gap-3 ${views.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {views.map((v) => (
            <div key={v} className={`${mobileView === v ? "block" : "hidden"} ${views.length > 1 ? "sm:block" : ""}`}>
              {views.length > 1 && (
                <p className="mb-1.5 text-center text-xs font-bold uppercase tracking-widest text-zinc-500">
                  {viewLabel(locale, v)}
                </p>
              )}
              <div className={`mx-auto w-full max-w-[240px] ${aspectClass}`}>
                <ViewPanel view={v} measurementType={measurementType} activeField={activeField} measurement={measurement} />
              </div>
            </div>
          ))}
        </div>
        <ChartLegend locale={locale} measurementType={measurementType} activeField={activeField} />
      </div>
    </div>
  );
}
