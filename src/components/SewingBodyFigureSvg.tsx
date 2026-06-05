import type { ReactNode } from "react";
import type { DiagramView } from "@/lib/measurement-diagram";
import type { MeasurementTypeId } from "@/lib/measurements";
import { BLOUSE_VIEWBOX, FIGURE_VIEWBOX } from "@/lib/measurement-diagram";

const SILHOUETTE = "#141414";

type Props = { view: DiagramView; variant: MeasurementTypeId };

function FullFrontBody() {
  return (
    <>
      <path
        d="M 100 16 C 88 16 80 28 80 42 C 80 50 82 56 86 62 L 88 68 C 72 72 58 82 52 98 L 44 118 C 38 138 36 158 38 178 L 42 208 C 44 232 48 252 54 272 L 62 298 L 72 318 L 78 340 L 82 368 L 84 392 L 88 400 L 96 402 L 100 398 L 104 402 L 112 400 L 116 392 L 118 368 L 122 340 L 128 318 L 138 298 L 146 272 C 152 252 156 232 158 208 L 162 178 C 164 158 162 138 156 118 L 148 98 C 142 82 128 72 112 68 L 114 62 C 118 56 120 50 120 42 C 120 28 112 16 100 16 Z"
        fill={SILHOUETTE}
      />
      <path d="M 52 98 L 38 130 L 28 168 L 22 210 L 20 248 L 24 258 L 30 240 L 38 190 L 48 140 Z" fill={SILHOUETTE} />
      <path d="M 148 98 L 162 130 L 172 168 L 178 210 L 180 248 L 176 258 L 170 240 L 162 190 L 152 140 Z" fill={SILHOUETTE} />
      <path d="M 96 318 L 92 368 L 88 398 M 104 318 L 108 368 L 112 398" stroke="#0f172a" strokeWidth="1.5" fill="none" opacity="0.35" />
    </>
  );
}

function FullSideBody() {
  return (
    <>
      <path
        d="M 122 18 C 132 18 136 32 132 46 L 134 54 L 138 68 C 142 78 144 88 142 98 L 138 118 C 136 132 138 148 142 162 C 148 182 150 198 146 214 C 142 232 136 248 132 268 L 128 310 L 124 352 L 120 392 L 112 396 L 108 352 L 104 300 L 98 248 L 92 210 C 88 188 86 172 88 158 C 90 142 94 128 98 114 L 102 94 C 104 82 102 70 96 58 C 92 48 88 38 92 30 C 96 22 106 16 122 18 Z"
        fill={SILHOUETTE}
      />
      <path d="M 112 396 L 108 404 L 118 404 L 120 392" fill={SILHOUETTE} />
    </>
  );
}

function BlouseFrontUpper() {
  return (
    <>
      <path
        d="M 100 16 C 88 16 80 28 80 42 C 80 50 82 56 86 62 L 88 68 C 72 72 58 82 52 98 L 44 118 C 38 138 36 158 38 178 L 42 208 C 44 228 48 242 54 252 L 62 268 L 72 278 L 78 284 L 100 286 L 122 284 L 128 278 L 138 268 L 146 252 C 152 242 156 228 158 208 L 162 178 C 164 158 162 138 156 118 L 148 98 C 142 82 128 72 112 68 L 114 62 C 118 56 120 50 120 42 C 120 28 112 16 100 16 Z"
        fill={SILHOUETTE}
      />
      <path d="M 52 98 L 38 130 L 28 168 L 22 210 L 20 248 L 24 258 L 30 240 L 38 190 L 48 140 Z" fill={SILHOUETTE} />
      <path d="M 148 98 L 162 130 L 172 168 L 178 210 L 180 248 L 176 258 L 170 240 L 162 190 L 152 140 Z" fill={SILHOUETTE} />
    </>
  );
}

function BlouseBackUpper() {
  return (
    <path
      d="M 100 16 C 88 16 80 28 80 42 C 80 50 82 56 86 62 L 88 68 C 72 72 58 82 52 98 L 44 118 C 38 138 36 158 38 178 L 42 208 C 44 228 48 242 54 252 L 62 268 L 72 278 L 78 284 L 100 286 L 122 284 L 128 278 L 138 268 L 146 252 C 152 242 156 228 158 208 L 162 178 C 164 158 162 138 156 118 L 148 98 C 142 82 128 72 112 68 L 114 62 C 118 56 120 50 120 42 C 120 28 112 16 100 16 Z"
      fill={SILHOUETTE}
    />
  );
}

/** Sewing-chart silhouettes — variant per garment type */
export function SewingBodyFigureSvg({ view, variant }: Props) {
  const childScale = variant === "child";

  const wrap = (body: ReactNode) =>
    childScale ? (
      <g transform="translate(22, 24) scale(0.78)">{body}</g>
    ) : (
      <g>{body}</g>
    );

  if (view === "side") {
    return <g className="sewing-body-silhouette">{wrap(<FullSideBody />)}</g>;
  }

  if (view === "back") {
    return <g className="sewing-body-silhouette">{wrap(<BlouseBackUpper />)}</g>;
  }

  if (variant === "blouse") {
    return <g className="sewing-body-silhouette">{wrap(<BlouseFrontUpper />)}</g>;
  }

  return <g className="sewing-body-silhouette">{wrap(<FullFrontBody />)}</g>;
}

export function SewingChartDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <marker id={`sewArrow-${uid}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="#ffffff" />
      </marker>
      <filter id={`lineGlow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#fff" floodOpacity="0.85" />
      </filter>
    </defs>
  );
}

export function SewingChartBackground({ variant }: { variant: MeasurementTypeId }) {
  const box = variant === "blouse" ? BLOUSE_VIEWBOX : FIGURE_VIEWBOX;
  return (
    <>
      <rect width={box.w} height={box.h} fill="#0f172a" rx="4" />
      <rect width={box.w} height={box.h} fill="url(#sewingVignette)" opacity="0.4" />
    </>
  );
}

export function SewingChartBackgroundDefs() {
  return (
    <defs>
      <radialGradient id="sewingVignette" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#334155" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

export { FIGURE_VIEWBOX, BLOUSE_VIEWBOX };
