import type { ReactNode } from "react";
import type { DiagramView } from "@/lib/measurement-diagram";
import type { MeasurementTypeId } from "@/lib/measurements";
import { BLOUSE_VIEWBOX, FIGURE_VIEWBOX } from "@/lib/measurement-diagram";

const STROKE = "#141414";
const SW = 1.75;
const SW_LIGHT = 1.25;

type Props = { view: DiagramView; variant: MeasurementTypeId };

/** Fashion flat sketch — blouse / upper torso (front) */
function LineArtBlouseFront() {
  return (
    <>
      {/* Square neckline */}
      <path
        d="M 76 52 L 76 64 L 124 64 L 124 52"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M 82 58 L 118 58" stroke={STROKE} strokeWidth={SW_LIGHT} opacity="0.35" />
      {/* Collarbones */}
      <path d="M 84 66 L 116 66" stroke={STROKE} strokeWidth={SW_LIGHT} opacity="0.45" />
      {/* Shoulders */}
      <path d="M 76 64 L 52 78" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 124 64 L 148 78" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* Left arm */}
      <path
        d="M 52 78 C 38 96 30 118 26 148 C 22 172 24 198 30 218"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right arm */}
      <path
        d="M 148 78 C 162 96 170 118 174 148 C 178 172 176 198 170 218"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Torso */}
      <path
        d="M 52 78
           C 44 98 42 118 46 138
           C 50 158 56 178 64 198
           C 72 216 84 232 100 238
           C 116 232 128 216 136 198
           C 144 178 150 158 154 138
           C 158 118 156 98 148 78"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* Bust guide curves (subtle) */}
      <path d="M 68 98 Q 80 108 68 118" fill="none" stroke={STROKE} strokeWidth={1} opacity="0.2" />
      <path d="M 132 98 Q 120 108 132 118" fill="none" stroke={STROKE} strokeWidth={1} opacity="0.2" />
      {/* Hem */}
      <path d="M 64 238 Q 100 244 136 238" fill="none" stroke={STROKE} strokeWidth={SW_LIGHT} opacity="0.5" />
    </>
  );
}

/** Blouse back — line art */
function LineArtBlouseBack() {
  return (
    <>
      <path
        d="M 82 52 Q 100 60 118 52"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path d="M 76 58 L 52 78" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 124 58 L 148 78" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M 52 78 C 44 98 42 118 46 138 C 50 158 56 178 64 198 C 72 216 84 232 100 238 C 116 232 128 216 136 198 C 144 178 150 158 154 138 C 158 118 156 98 148 78"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <line x1="100" y1="58" x2="100" y2="238" stroke={STROKE} strokeWidth={1} opacity="0.25" strokeDasharray="4 3" />
      <path d="M 30 148 C 22 172 24 198 30 218" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 170 148 C 178 172 176 198 170 218" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </>
  );
}

/** Side profile — line art */
function LineArtSideBody() {
  return (
    <>
      <path
        d="M 118 28 C 128 28 132 42 128 54 L 130 62"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 130 62
           C 138 72 142 86 140 102
           C 136 122 128 142 118 162
           C 108 182 98 204 92 228
           C 88 248 86 268 88 288
           L 96 292 L 104 288"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M 136 88 C 128 108 120 132 112 158 C 104 182 98 208 94 232"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW_LIGHT}
        strokeLinecap="round"
        opacity="0.55"
      />
    </>
  );
}

/** Full dress form — front line art */
function LineArtDressFront() {
  return (
    <>
      <ellipse cx="100" cy="32" rx="14" ry="16" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 88 46 L 88 58 L 112 58 L 112 46" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 88 58 L 58 74" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 112 58 L 142 74" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M 58 74 C 42 92 36 118 38 148 C 40 178 48 208 58 238 C 66 264 76 288 88 308 L 100 318 L 112 308 C 124 288 134 264 142 238 C 152 208 160 178 162 148 C 164 118 158 92 142 74"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M 38 130 L 22 168 L 18 210 L 22 248" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 162 130 L 178 168 L 182 210 L 178 248" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 88 318 L 82 368 L 80 398 M 112 318 L 118 368 L 120 398" stroke={STROKE} strokeWidth={SW_LIGHT} opacity="0.45" />
    </>
  );
}

/** Child — simplified line art front */
function LineArtChildFront() {
  return (
    <>
      <circle cx="100" cy="36" r="16" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 88 50 L 88 62 L 112 62 L 112 50" fill="none" stroke={STROKE} strokeWidth={SW} />
      <path d="M 88 62 L 62 78" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 112 62 L 138 78" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path
        d="M 62 78 C 52 100 50 128 54 158 C 58 188 66 218 76 248 C 84 272 92 292 100 302 C 108 292 116 272 124 248 C 134 218 142 188 146 158 C 150 128 148 100 138 78"
        fill="none"
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M 54 158 L 38 190 L 32 228" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 146 158 L 162 190 L 168 228" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M 92 302 L 88 340 L 86 368 M 108 302 L 112 340 L 114 368" stroke={STROKE} strokeWidth={SW_LIGHT} opacity="0.45" />
    </>
  );
}

export function SewingBodyFigureSvg({ view, variant }: Props) {
  const wrap = (body: ReactNode) => (
    <g className="sewing-body-line-art" strokeLinecap="round" strokeLinejoin="round">
      {body}
    </g>
  );

  if (view === "side") {
    return wrap(<LineArtSideBody />);
  }

  if (view === "back") {
    return wrap(<LineArtBlouseBack />);
  }

  if (variant === "blouse") {
    return wrap(<LineArtBlouseFront />);
  }

  if (variant === "child") {
    return wrap(<LineArtChildFront />);
  }

  return wrap(<LineArtDressFront />);
}

export function SewingChartDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <marker id={`sewArrow-${uid}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
      </marker>
      <filter id={`lineGlow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#e11d48" floodOpacity="0.65" />
      </filter>
    </defs>
  );
}

export function SewingChartBackground({ variant }: { variant: MeasurementTypeId }) {
  const box = variant === "blouse" ? BLOUSE_VIEWBOX : FIGURE_VIEWBOX;
  return (
    <>
      <rect width={box.w} height={box.h} fill="#ffffff" rx="8" />
      <rect width={box.w} height={box.h} fill="url(#lineArtGrid)" opacity="0.35" rx="8" />
    </>
  );
}

export function SewingChartBackgroundDefs() {
  return (
    <defs>
      <pattern id="lineArtGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e7e5e4" strokeWidth="0.5" />
      </pattern>
    </defs>
  );
}

export { FIGURE_VIEWBOX, BLOUSE_VIEWBOX };
