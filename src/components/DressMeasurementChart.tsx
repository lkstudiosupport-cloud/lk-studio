import type { MeasurementFieldKey } from "@/lib/measurements";

/** Dress / shirt chart — 18-point institute style */
export const DRESS_CHART_VIEWBOX = { w: 280, h: 460 };

export type DressDiagramLine = {
  key: MeasurementFieldKey;
  num: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lx: number;
  ly: number;
  kind: "horizontal" | "vertical" | "diagonal";
};

export const DRESS_CHART_LINES: DressDiagramLine[] = [
  { key: "length", num: "1", kind: "vertical", x1: 140, y1: 48, x2: 140, y2: 420, lx: 156, ly: 234 },
  { key: "bust", num: "2", kind: "horizontal", x1: 68, y1: 108, x2: 212, y2: 108, lx: 224, ly: 108 },
  { key: "underBust", num: "3", kind: "horizontal", x1: 70, y1: 128, x2: 210, y2: 128, lx: 224, ly: 128 },
  { key: "waist", num: "4", kind: "horizontal", x1: 74, y1: 158, x2: 206, y2: 158, lx: 224, ly: 158 },
  { key: "armLength", num: "5", kind: "vertical", x1: 38, y1: 78, x2: 38, y2: 248, lx: 22, ly: 162 },
  { key: "wrist", num: "6", kind: "horizontal", x1: 22, y1: 238, x2: 48, y2: 238, lx: 10, ly: 238 },
  { key: "bicep", num: "7", kind: "horizontal", x1: 28, y1: 138, x2: 58, y2: 138, lx: 14, ly: 138 },
  { key: "frontNeck", num: "8", kind: "diagonal", x1: 118, y1: 52, x2: 140, y2: 82, lx: 108, ly: 72 },
  { key: "backNeck", num: "9", kind: "horizontal", x1: 108, y1: 52, x2: 172, y2: 52, lx: 190, ly: 52 },
];

export function DressChartDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <radialGradient id={`dressStudio-${uid}`} cx="50%" cy="16%" r="80%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#fafaf9" />
        <stop offset="100%" stopColor="#e7e5e4" />
      </radialGradient>
      <linearGradient id={`dressMannequin-${uid}`} x1="18%" y1="0%" x2="82%" y2="100%">
        <stop offset="0%" stopColor="#fdf2f8" />
        <stop offset="30%" stopColor="#f9a8d4" />
        <stop offset="58%" stopColor="#ec4899" />
        <stop offset="82%" stopColor="#be185d" />
        <stop offset="100%" stopColor="#831843" />
      </linearGradient>
      <linearGradient id={`dressSkin-${uid}`} x1="22%" y1="0%" x2="78%" y2="100%">
        <stop offset="0%" stopColor="#fff7f0" />
        <stop offset="45%" stopColor="#edd9cc" />
        <stop offset="100%" stopColor="#c4a494" />
      </linearGradient>
      <linearGradient id={`dressChrome-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="45%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <filter id={`dressShadow-${uid}`} x="-20%" y="-10%" width="140%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#44403c" floodOpacity="0.28" />
      </filter>
      <marker id={`dressArrow-${uid}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="#db2777" />
      </marker>
      <marker id={`dressArrowStart-${uid}`} markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
        <path d="M6,0 L0,3 L6,6 Z" fill="#db2777" />
      </marker>
      <filter id={`dressGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ec4899" floodOpacity="0.75" />
      </filter>
    </defs>
  );
}

/** Full-length dress-form mannequin — front */
export function DressMannequinFigure({ uid }: { uid: string }) {
  const fill = `url(#dressMannequin-${uid})`;
  const skin = `url(#dressSkin-${uid})`;
  const outline = "#831843";

  return (
    <g className="dress-mannequin-figure measurement-figure-wrap" filter={`url(#dressShadow-${uid})`}>
      <rect width={280} height={460} fill={`url(#dressStudio-${uid})`} />
      <ellipse cx="140" cy="48" rx="100" ry="50" fill="#fff" opacity="0.3" />
      <ellipse cx="140" cy="448" rx="90" ry="14" fill="#78716c" opacity="0.1" />
      <rect x="131" y="388" width="18" height="58" fill={`url(#dressChrome-${uid})`} rx="4" />
      <ellipse cx="140" cy="388" rx="22" ry="5" fill={`url(#dressChrome-${uid})`} />

      {/* Head cap */}
      <ellipse cx="140" cy="30" rx="18" ry="22" fill={skin} stroke="#c4a494" strokeWidth="0.6" />
      <ellipse cx="132" cy="22" rx="7" ry="9" fill="#fff" opacity="0.28" />

      {/* Neck */}
      <path d="M 124 50 L 124 66 L 156 66 L 156 50 Q 140 56 124 50" fill={skin} stroke="#c4a494" strokeWidth="0.5" />
      <ellipse cx="140" cy="66" rx="20" ry="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.4" />

      {/* Full torso & dress form */}
      <path
        d="M 56 68
           C 40 72 32 86 30 106
           L 26 148 C 24 168 26 188 32 208
           L 40 248 C 44 272 50 292 58 312
           L 68 328 L 84 338 L 140 340 L 196 338
           L 212 328 L 222 312 C 230 292 236 272 240 248
           L 248 208 C 254 188 256 168 254 148
           L 250 106 C 248 86 240 72 224 68
           C 198 62 170 60 140 60 C 110 60 82 62 56 68 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="1"
      />

      {/* Bust shaping */}
      <path d="M 88 88 C 76 98 70 108 68 118 C 82 124 98 118 106 106 C 100 94 94 88 88 88" fill="#fff" opacity="0.14" />
      <path d="M 192 88 C 204 98 210 108 212 118 C 198 124 182 118 174 106 C 180 94 186 88 192 88" fill="#fff" opacity="0.14" />

      {/* Waist shadow */}
      <path d="M 78 152 Q 140 142 202 152 Q 140 164 78 152" fill="#000" opacity="0.07" />

      {/* Fabric sheen */}
      <path
        d="M 140 72 Q 96 88 78 112 Q 86 168 96 228 Q 140 248 184 228 Q 194 168 202 112 Q 184 88 140 72"
        fill="#fff"
        opacity="0.1"
      />

      {/* Arms */}
      <path
        d="M 30 106 L 20 136 L 14 176 L 10 216 L 8 246
           L 14 250 L 20 216 L 28 176 L 36 136 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="0.85"
      />
      <path
        d="M 250 106 L 260 136 L 266 176 L 270 216 L 272 246
           L 266 250 L 260 216 L 252 176 L 244 136 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="0.85"
      />

      {/* Legs */}
      <path
        d="M 108 340 L 98 380 L 94 420 L 96 434 L 108 436
           L 112 420 L 116 380 L 120 340"
        fill={fill}
        stroke={outline}
        strokeWidth="0.75"
      />
      <path
        d="M 172 340 L 182 380 L 186 420 L 184 434 L 172 436
           L 168 420 L 164 380 L 160 340"
        fill={fill}
        stroke={outline}
        strokeWidth="0.75"
      />

      {/* V-neck guide */}
      <path d="M 124 66 L 132 80 L 140 86 L 148 80 L 156 66" fill="none" stroke="#fce7f3" strokeWidth="0.7" opacity="0.55" />
      <path d="M 128 66 L 134 76 L 140 80 L 146 76 L 152 66" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.35" />
    </g>
  );
}
