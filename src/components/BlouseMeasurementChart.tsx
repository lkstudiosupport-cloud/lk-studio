import type { MeasurementFieldKey } from "@/lib/measurements";

export const BLOUSE_CHART_VIEWBOX = { w: 260, h: 340 };

export type BlouseDiagramLine = {
  key: MeasurementFieldKey;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lx: number;
  ly: number;
  num: string;
};

/** Front — 7 institute measurements */
export const BLOUSE_CHART_LINES_FRONT: BlouseDiagramLine[] = [
  { key: "shoulder", num: "1", x1: 52, y1: 82, x2: 208, y2: 82, lx: 130, ly: 68 },
  { key: "armHole", num: "2", x1: 50, y1: 82, x2: 50, y2: 118, lx: 36, ly: 100 },
  { key: "chest", num: "3", x1: 58, y1: 122, x2: 202, y2: 122, lx: 130, ly: 110 },
  { key: "waist", num: "4", x1: 62, y1: 214, x2: 198, y2: 214, lx: 130, ly: 202 },
  { key: "blouseLen", num: "5", x1: 192, y1: 82, x2: 192, y2: 214, lx: 210, ly: 148 },
  { key: "armLength", num: "6", x1: 42, y1: 86, x2: 18, y2: 184, lx: 24, ly: 136 },
  { key: "sleeve", num: "7", x1: 8, y1: 188, x2: 38, y2: 188, lx: 22, ly: 176 },
];

/** Back — key lines visible from rear */
export const BLOUSE_CHART_LINES_BACK: BlouseDiagramLine[] = [
  { key: "shoulder", num: "1", x1: 52, y1: 82, x2: 208, y2: 82, lx: 130, ly: 68 },
  { key: "blouseLen", num: "5", x1: 130, y1: 82, x2: 130, y2: 214, lx: 148, ly: 148 },
  { key: "waist", num: "4", x1: 62, y1: 214, x2: 198, y2: 214, lx: 130, ly: 226 },
  { key: "armLength", num: "6", x1: 218, y1: 86, x2: 242, y2: 184, lx: 236, ly: 136 },
];

export function BlouseChartDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <radialGradient id={`studioLight-${uid}`} cx="50%" cy="22%" r="72%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
        <stop offset="55%" stopColor="#f5f5f4" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#d6d3d1" stopOpacity="0.15" />
      </radialGradient>
      <linearGradient id={`mannequinSkin-${uid}`} x1="18%" y1="0%" x2="88%" y2="100%">
        <stop offset="0%" stopColor="#fdf8f4" />
        <stop offset="35%" stopColor="#edd9cc" />
        <stop offset="72%" stopColor="#d4b8a8" />
        <stop offset="100%" stopColor="#b89a88" />
      </linearGradient>
      <linearGradient id={`mannequinSkinSide-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8d4c8" />
        <stop offset="45%" stopColor="#f7ebe3" />
        <stop offset="100%" stopColor="#c4a494" />
      </linearGradient>
      <linearGradient id={`blouseRed-${uid}`} x1="12%" y1="0%" x2="92%" y2="100%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="28%" stopColor="#f43f5e" />
        <stop offset="58%" stopColor="#be123c" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
      <linearGradient id={`blouseRedBack-${uid}`} x1="88%" y1="0%" x2="12%" y2="100%">
        <stop offset="0%" stopColor="#881337" />
        <stop offset="45%" stopColor="#be123c" />
        <stop offset="100%" stopColor="#701a35" />
      </linearGradient>
      <linearGradient id={`blouseRedSide-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9f1239" />
        <stop offset="40%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
      <linearGradient id={`chromeStand-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="42%" stopColor="#f8fafc" />
        <stop offset="58%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <filter id={`mannequinShadow-${uid}`} x="-25%" y="-12%" width="150%" height="125%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#57534e" floodOpacity="0.32" />
      </filter>
      <filter id={`fabricDepth-${uid}`} x="-12%" y="-12%" width="124%" height="124%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
        <feOffset dy="3" result="offsetBlur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.22" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <marker id={`blouseArrow-${uid}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#0f172a" />
      </marker>
      <filter id={`blouseLineGlow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#e11d48" floodOpacity="0.85" />
      </filter>
    </defs>
  );
}

function StudioFloor({ uid }: { uid: string }) {
  return (
    <>
      <ellipse cx="130" cy="322" rx="78" ry="11" fill="#78716c" opacity="0.1" />
      <rect x="122" y="268" width="16" height="56" fill={`url(#chromeStand-${uid})`} rx="4" />
      <ellipse cx="130" cy="268" rx="18" ry="5" fill={`url(#chromeStand-${uid})`} />
      <ellipse cx="130" cy="322" rx="42" ry="8" fill="#64748b" opacity="0.22" />
    </>
  );
}

/** Feminine dress-form torso — front */
function LadyTorsoFront({ uid, blouseFill }: { uid: string; blouseFill: string }) {
  const skin = `url(#mannequinSkin-${uid})`;

  return (
    <g filter={`url(#mannequinShadow-${uid})`}>
      <StudioFloor uid={uid} />

      {/* Head — smooth cap, no facial features */}
      <ellipse cx="130" cy="38" rx="17" ry="21" fill={skin} stroke="#c4a494" strokeWidth="0.6" />
      <ellipse cx="123" cy="32" rx="7" ry="9" fill="#fff" opacity="0.28" />

      {/* Neck */}
      <path
        d="M 118 56 Q 130 62 142 56 L 140 74 Q 130 78 120 74 Z"
        fill={skin}
        stroke="#c4a494"
        strokeWidth="0.5"
      />

      {/* Neck ring */}
      <ellipse cx="130" cy="76" rx="20" ry="4.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.45" opacity="0.92" />

      {/* Skin body under blouse — hourglass */}
      <path
        d="M 62 82
           C 48 84 40 96 36 112
           C 32 128 34 148 38 168
           C 42 188 48 206 56 222
           C 64 238 74 252 88 262
           L 108 272 L 130 274 L 152 272
           L 172 262 C 186 252 196 238 204 222
           C 212 206 218 188 222 168
           C 226 148 228 128 224 112
           C 220 96 212 84 198 82
           C 178 76 154 74 130 74
           C 106 74 82 76 62 82 Z"
        fill={skin}
        stroke="#c4a494"
        strokeWidth="0.4"
        opacity="0.55"
      />

      {/* Red blouse — fitted lady bodice with bust & waist shaping */}
      <path
        d="M 58 82
           C 42 86 34 100 30 118
           C 26 136 28 154 32 172
           C 36 190 42 206 50 220
           C 58 234 68 246 80 256
           L 98 266 L 130 268 L 162 266
           L 180 256 C 192 246 202 234 210 220
           C 218 206 224 190 228 172
           C 232 154 234 136 230 118
           C 226 100 218 86 202 82
           C 182 76 156 74 130 74
           C 104 74 78 76 58 82 Z"
        fill={blouseFill}
        stroke="#701a35"
        strokeWidth="0.9"
        filter={`url(#fabricDepth-${uid})`}
      />

      {/* Bust contour — left */}
      <path
        d="M 88 98 C 78 108 72 118 70 128 C 82 132 96 128 102 118 C 98 108 94 102 88 98"
        fill="#fff"
        opacity="0.14"
      />
      {/* Bust contour — right */}
      <path
        d="M 172 98 C 182 108 188 118 190 128 C 178 132 164 128 158 118 C 162 108 166 102 172 98"
        fill="#fff"
        opacity="0.14"
      />

      {/* Waist shadow */}
      <path
        d="M 72 198 Q 130 188 188 198 Q 130 210 72 198"
        fill="#000"
        opacity="0.06"
      />

      {/* Square neckline */}
      <path d="M 106 82 L 106 96 L 154 96 L 154 82 Z" fill={skin} stroke="#701a35" strokeWidth="0.7" />

      {/* Fabric sheen */}
      <path
        d="M 130 92 Q 92 104 76 122 Q 84 168 94 210 Q 130 224 166 210 Q 176 168 184 122 Q 168 104 130 92"
        fill="#fff"
        opacity="0.1"
      />

      {/* Short puffed sleeves — arms slightly away from body */}
      <path
        d="M 30 118 C 22 128 14 148 8 172 L 4 192 L 12 196 L 18 172 C 24 150 30 132 36 120 Z"
        fill={blouseFill}
        stroke="#701a35"
        strokeWidth="0.7"
      />
      <path
        d="M 230 118 C 238 128 246 148 252 172 L 256 192 L 248 196 L 242 172 C 236 150 230 132 224 120 Z"
        fill={blouseFill}
        stroke="#701a35"
        strokeWidth="0.7"
      />
      <ellipse cx="12" cy="194" rx="11" ry="6.5" fill={blouseFill} stroke="#701a35" strokeWidth="0.5" />
      <ellipse cx="248" cy="194" rx="11" ry="6.5" fill={blouseFill} stroke="#701a35" strokeWidth="0.5" />

      {/* Hip hint below blouse hem */}
      <path
        d="M 88 268 Q 130 276 172 268 L 168 282 Q 130 288 92 282 Z"
        fill={skin}
        stroke="#c4a494"
        strokeWidth="0.4"
        opacity="0.45"
      />
    </g>
  );
}

/** Feminine dress-form — back */
function LadyTorsoBack({ uid, blouseFill }: { uid: string; blouseFill: string }) {
  const skin = `url(#mannequinSkinSide-${uid})`;

  return (
    <g filter={`url(#mannequinShadow-${uid})`}>
      <StudioFloor uid={uid} />
      <ellipse cx="130" cy="38" rx="17" ry="21" fill={skin} stroke="#c4a494" strokeWidth="0.6" />
      <path d="M 118 56 Q 130 62 142 56 L 142 74 Q 130 78 118 74 Z" fill={skin} stroke="#c4a494" strokeWidth="0.5" />
      <ellipse cx="130" cy="76" rx="20" ry="4.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.45" opacity="0.92" />

      <path
        d="M 58 82
           C 42 86 34 100 30 118
           C 26 136 28 154 32 172
           C 36 190 42 206 50 220
           C 58 234 68 246 80 256
           L 98 266 L 130 268 L 162 266
           L 180 256 C 192 246 202 234 210 220
           C 218 206 224 190 228 172
           C 232 154 234 136 230 118
           C 226 100 218 86 202 82
           C 182 76 156 74 130 74
           C 104 74 78 76 58 82 Z"
        fill={blouseFill}
        stroke="#701a35"
        strokeWidth="0.9"
        filter={`url(#fabricDepth-${uid})`}
      />

      {/* Shoulder blade shading */}
      <path d="M 88 98 Q 98 112 96 128 Q 88 118 88 98" fill="#000" opacity="0.07" />
      <path d="M 172 98 Q 162 112 164 128 Q 172 118 172 98" fill="#000" opacity="0.07" />

      <line x1="130" y1="82" x2="130" y2="262" stroke="#701a35" strokeWidth="0.7" opacity="0.4" strokeDasharray="4 3" />
      <path d="M 112 82 Q 130 90 148 82" fill="none" stroke="#701a35" strokeWidth="0.6" opacity="0.45" />

      <path d="M 30 118 C 22 128 14 148 8 172 L 4 192 L 12 196 L 18 172 C 24 150 30 132 36 120 Z" fill={blouseFill} stroke="#701a35" strokeWidth="0.7" />
      <path d="M 230 118 C 238 128 246 148 252 172 L 256 192 L 248 196 L 242 172 C 236 150 230 132 224 120 Z" fill={blouseFill} stroke="#701a35" strokeWidth="0.7" />
    </g>
  );
}

/** Side profile — shows bust projection & waist curve for 3D depth */
function LadyTorsoSide({ uid, facing }: { uid: string; facing: "left" | "right" }) {
  const skin = `url(#mannequinSkinSide-${uid})`;
  const blouse = `url(#blouseRedSide-${uid})`;
  const mirror = facing === "right" ? "scale(-1,1) translate(-260,0)" : undefined;

  return (
    <g transform={mirror} filter={`url(#mannequinShadow-${uid})`}>
      <StudioFloor uid={uid} />

      {/* Profile head */}
      <ellipse cx="118" cy="38" rx="14" ry="21" fill={skin} stroke="#c4a494" strokeWidth="0.6" />
      <path d="M 108 32 Q 118 28 128 34 Q 122 42 108 38 Z" fill="#fff" opacity="0.22" />

      {/* Neck — forward curve */}
      <path d="M 112 56 Q 118 64 124 72 L 120 78 Q 112 70 108 62 Z" fill={skin} stroke="#c4a494" strokeWidth="0.5" />

      {/* Torso profile — bust forward, waist in, slight hip */}
      <path
        d="M 148 82
           C 156 88 160 98 162 112
           C 164 128 162 142 158 158
           C 152 178 142 198 128 218
           C 118 232 108 246 98 258
           L 88 268 L 82 274
           C 78 260 76 244 78 228
           C 82 208 88 188 94 168
           C 98 148 100 128 104 112
           C 108 96 114 86 124 82
           C 132 78 140 78 148 82 Z"
        fill={skin}
        stroke="#c4a494"
        strokeWidth="0.45"
        opacity="0.5"
      />

      {/* Blouse on profile */}
      <path
        d="M 152 82
           C 162 90 168 102 170 118
           C 172 134 170 150 164 166
           C 156 186 142 206 126 224
           C 114 238 102 252 90 264
           L 84 268
           C 80 252 78 234 80 216
           C 84 196 90 176 96 156
           C 100 136 102 116 106 100
           C 110 88 118 80 128 78
           C 138 76 146 78 152 82 Z"
        fill={blouse}
        stroke="#701a35"
        strokeWidth="0.8"
        filter={`url(#fabricDepth-${uid})`}
      />

      {/* Bust highlight */}
      <ellipse cx="158" cy="118" rx="10" ry="14" fill="#fff" opacity="0.12" />

      {/* Arm at side */}
      <path
        d="M 104 112 C 96 132 88 158 82 182 L 78 198 L 84 200 L 90 182 C 96 158 100 136 108 118 Z"
        fill={blouse}
        stroke="#701a35"
        strokeWidth="0.6"
      />
      <ellipse cx="80" cy="198" rx="8" ry="5" fill={blouse} stroke="#701a35" strokeWidth="0.45" />
    </g>
  );
}

export function BlouseMannequinFront({ uid }: { uid: string }) {
  return <LadyTorsoFront uid={uid} blouseFill={`url(#blouseRed-${uid})`} />;
}

export function BlouseMannequinBack({ uid }: { uid: string }) {
  return <LadyTorsoBack uid={uid} blouseFill={`url(#blouseRedBack-${uid})`} />;
}

export function BlouseMannequinSideLeft({ uid }: { uid: string }) {
  return <LadyTorsoSide uid={uid} facing="left" />;
}

export function BlouseMannequinSideRight({ uid }: { uid: string }) {
  return <LadyTorsoSide uid={uid} facing="right" />;
}

/** @deprecated use FRONT lines */
export const BLOUSE_CHART_LINES = BLOUSE_CHART_LINES_FRONT;

export function BlouseMannequinFigure({ uid }: { uid: string }) {
  return <BlouseMannequinFront uid={uid} />;
}
