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
  /** horizontal body rings vs vertical lengths */
  kind: "horizontal" | "vertical" | "diagonal";
};

export const DRESS_CHART_LINES: DressDiagramLine[] = [
  { key: "neck", num: "1", kind: "horizontal", x1: 108, y1: 52, x2: 172, y2: 52, lx: 190, ly: 52 },
  { key: "overBust", num: "2", kind: "horizontal", x1: 72, y1: 88, x2: 208, y2: 88, lx: 224, ly: 88 },
  { key: "bust", num: "3", kind: "horizontal", x1: 68, y1: 108, x2: 212, y2: 108, lx: 224, ly: 108 },
  { key: "underBust", num: "4", kind: "horizontal", x1: 70, y1: 128, x2: 210, y2: 128, lx: 224, ly: 128 },
  { key: "waist", num: "5", kind: "horizontal", x1: 74, y1: 158, x2: 206, y2: 158, lx: 224, ly: 158 },
  { key: "hip", num: "6", kind: "horizontal", x1: 68, y1: 192, x2: 212, y2: 192, lx: 224, ly: 192 },
  { key: "length", num: "7", kind: "vertical", x1: 140, y1: 48, x2: 140, y2: 420, lx: 156, ly: 234 },
  { key: "neckToAboveKnee", num: "8", kind: "vertical", x1: 118, y1: 48, x2: 118, y2: 318, lx: 98, ly: 180 },
  { key: "aboveKneeToAnkle", num: "9", kind: "vertical", x1: 162, y1: 318, x2: 162, y2: 420, lx: 178, ly: 368 },
  { key: "armLength", num: "10", kind: "vertical", x1: 38, y1: 78, x2: 38, y2: 248, lx: 22, ly: 162 },
  { key: "shoulder", num: "11", kind: "horizontal", x1: 58, y1: 68, x2: 222, y2: 68, lx: 240, ly: 68 },
  { key: "armHole", num: "12", kind: "horizontal", x1: 54, y1: 98, x2: 226, y2: 98, lx: 240, ly: 98 },
  { key: "bicep", num: "13", kind: "horizontal", x1: 28, y1: 138, x2: 58, y2: 138, lx: 14, ly: 138 },
  { key: "foreArm", num: "14", kind: "horizontal", x1: 24, y1: 188, x2: 52, y2: 188, lx: 12, ly: 188 },
  { key: "wrist", num: "15", kind: "horizontal", x1: 22, y1: 238, x2: 48, y2: 238, lx: 10, ly: 238 },
  { key: "frontNeck", num: "16", kind: "diagonal", x1: 118, y1: 52, x2: 140, y2: 82, lx: 108, ly: 72 },
  { key: "frontWaist", num: "17", kind: "vertical", x1: 68, y1: 68, x2: 68, y2: 158, lx: 52, ly: 112 },
  { key: "trouserThreeQuarter", num: "18", kind: "vertical", x1: 198, y1: 158, x2: 198, y2: 318, lx: 214, ly: 238 },
];

export function DressChartDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`dressMannequin-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fce7f3" />
        <stop offset="100%" stopColor="#fbcfe8" />
      </linearGradient>
      <marker id={`dressArrow-${uid}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="#db2777" />
      </marker>
      <marker id={`dressArrowStart-${uid}`} markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
        <path d="M6,0 L0,3 L6,6 Z" fill="#db2777" />
      </marker>
      <filter id={`dressGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ec4899" floodOpacity="0.7" />
      </filter>
    </defs>
  );
}

/** Front mannequin outline — dress measurement chart */
export function DressMannequinFigure({ uid }: { uid: string }) {
  const fill = `url(#dressMannequin-${uid})`;
  const outline = "#831843";

  return (
    <g className="dress-mannequin-figure" opacity="0.95">
      {/* Head */}
      <ellipse cx="140" cy="32" rx="20" ry="24" fill={fill} stroke={outline} strokeWidth="1" />
      {/* Neck */}
      <path d="M 124 52 L 124 68 L 156 68 L 156 52 Q 140 58 124 52" fill={fill} stroke={outline} strokeWidth="0.8" />
      {/* Torso */}
      <path
        d="M 58 68
           C 42 72 36 88 34 108
           L 30 148 C 28 168 30 188 36 208
           L 44 248 C 48 272 54 292 62 312
           L 72 328 L 88 338 L 140 340 L 192 338
           L 208 328 L 218 312 C 226 292 232 272 236 248
           L 244 208 C 250 188 252 168 250 148
           L 246 108 C 244 88 238 72 222 68
           C 200 62 180 60 140 60 C 100 60 80 62 58 68 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="1.2"
      />
      {/* Left arm */}
      <path
        d="M 34 108 L 24 138 L 18 178 L 14 218 L 12 248
           L 18 252 L 24 218 L 32 178 L 40 138 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="1"
      />
      {/* Right arm */}
      <path
        d="M 246 108 L 256 138 L 262 178 L 266 218 L 268 248
           L 262 252 L 256 218 L 248 178 L 240 138 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="1"
      />
      {/* Legs */}
      <path
        d="M 108 340 L 100 380 L 96 420 L 98 432 L 108 434
           L 112 420 L 116 380 L 120 340"
        fill={fill}
        stroke={outline}
        strokeWidth="0.9"
      />
      <path
        d="M 172 340 L 180 380 L 184 420 L 182 432 L 172 434
           L 168 420 L 164 380 L 160 340"
        fill={fill}
        stroke={outline}
        strokeWidth="0.9"
      />
      {/* V-neck guide hint */}
      <path d="M 124 68 L 132 82 L 140 88 L 148 82 L 156 68" fill="none" stroke="#be185d" strokeWidth="0.6" opacity="0.4" strokeDasharray="3 2" />
    </g>
  );
}
