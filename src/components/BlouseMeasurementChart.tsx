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
      <radialGradient id={`studioLight-${uid}`} cx="50%" cy="18%" r="78%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="45%" stopColor="#fafaf9" stopOpacity="0.92" />
        <stop offset="100%" stopColor="#e7e5e4" stopOpacity="0.55" />
      </radialGradient>
      <linearGradient id={`studioFloor-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f5f5f4" />
        <stop offset="100%" stopColor="#d6d3d1" />
      </linearGradient>
      <linearGradient id={`mannequinSkin-${uid}`} x1="22%" y1="0%" x2="82%" y2="100%">
        <stop offset="0%" stopColor="#fff7f0" />
        <stop offset="28%" stopColor="#f0ddd0" />
        <stop offset="55%" stopColor="#ddbda8" />
        <stop offset="82%" stopColor="#c9a088" />
        <stop offset="100%" stopColor="#a88472" />
      </linearGradient>
      <linearGradient id={`mannequinSkinSide-${uid}`} x1="0%" y1="8%" x2="100%" y2="92%">
        <stop offset="0%" stopColor="#dcc4b4" />
        <stop offset="35%" stopColor="#f5ebe3" />
        <stop offset="68%" stopColor="#e8d0c0" />
        <stop offset="100%" stopColor="#b8927e" />
      </linearGradient>
      <linearGradient id={`mannequinSkinShadow-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
      </linearGradient>
      <linearGradient id={`blouseRed-${uid}`} x1="8%" y1="0%" x2="94%" y2="100%">
        <stop offset="0%" stopColor="#fecdd3" />
        <stop offset="22%" stopColor="#fb7185" />
        <stop offset="48%" stopColor="#e11d48" />
        <stop offset="72%" stopColor="#9f1239" />
        <stop offset="100%" stopColor="#4c0519" />
      </linearGradient>
      <linearGradient id={`blouseRedBack-${uid}`} x1="92%" y1="0%" x2="8%" y2="100%">
        <stop offset="0%" stopColor="#701a35" />
        <stop offset="40%" stopColor="#9f1239" />
        <stop offset="100%" stopColor="#450a0a" />
      </linearGradient>
      <linearGradient id={`blouseRedSide-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#881337" />
        <stop offset="38%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#500724" />
      </linearGradient>
      <linearGradient id={`chromeStand-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="18%" stopColor="#64748b" />
        <stop offset="42%" stopColor="#f8fafc" />
        <stop offset="58%" stopColor="#cbd5e1" />
        <stop offset="82%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id={`chromeCollar-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <pattern id={`fabricWeave-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeWidth="0.35" opacity="0.08" />
        <line x1="3" y1="0" x2="3" y2="6" stroke="#000" strokeWidth="0.25" opacity="0.06" />
      </pattern>
      <filter id={`mannequinShadow-${uid}`} x="-30%" y="-15%" width="160%" height="130%">
        <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#44403c" floodOpacity="0.35" />
      </filter>
      <filter id={`fabricDepth-${uid}`} x="-15%" y="-15%" width="130%" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feOffset dy="4" result="offsetBlur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.25" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`skinSoft-${uid}`} x="-8%" y="-8%" width="116%" height="116%">
        <feGaussianBlur stdDeviation="0.6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <marker id={`blouseArrow-${uid}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#0f172a" />
      </marker>
      <filter id={`blouseLineGlow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#e11d48" floodOpacity="0.9" />
      </filter>
      <clipPath id={`blouseClip-${uid}`}>
        <path d="M 56 82 C 38 88 28 104 24 122 C 20 140 22 158 28 176 C 34 194 42 210 52 224 C 62 238 74 250 88 260 L 106 268 L 130 270 L 154 268 L 172 260 C 186 250 198 238 208 224 C 218 210 226 194 232 176 C 238 158 240 140 236 122 C 232 104 222 88 204 82 C 180 76 154 74 130 74 C 106 74 80 76 56 82 Z" />
      </clipPath>
    </defs>
  );
}

function ShowroomBackdrop({ uid }: { uid: string }) {
  return (
    <>
      <rect width={260} height={340} fill={`url(#studioLight-${uid})`} />
      <rect y="248" width={260} height={92} fill={`url(#studioFloor-${uid})`} opacity="0.55" />
      <ellipse cx="130" cy="52" rx="95" ry="55" fill="#fff" opacity="0.35" />
      <ellipse cx="130" cy="318" rx="100" ry="18" fill="#78716c" opacity="0.08" />
    </>
  );
}

function StudioFloor({ uid }: { uid: string }) {
  return (
    <g>
      <ellipse cx="130" cy="324" rx="88" ry="12" fill="#292524" opacity="0.12" />
      <ellipse cx="130" cy="322" rx="62" ry="8" fill="#57534e" opacity="0.18" />
      <rect x="119" y="262" width="22" height="62" fill={`url(#chromeStand-${uid})`} rx="5" />
      <rect x="121" y="268" width="18" height="4" fill="#f8fafc" opacity="0.55" rx="1" />
      <ellipse cx="130" cy="262" rx="24" ry="6" fill={`url(#chromeCollar-${uid})`} stroke="#64748b" strokeWidth="0.5" />
      <ellipse cx="130" cy="262" rx="14" ry="3.5" fill="#e2e8f0" opacity="0.7" />
      <ellipse cx="130" cy="324" rx="48" ry="9" fill="#64748b" opacity="0.2" />
    </g>
  );
}

/** Professional lady dress-form — front */
function LadyTorsoFront({ uid, blouseFill }: { uid: string; blouseFill: string }) {
  const skin = `url(#mannequinSkin-${uid})`;

  return (
    <g filter={`url(#mannequinShadow-${uid})`} className="measurement-figure-wrap">
      <ShowroomBackdrop uid={uid} />
      <StudioFloor uid={uid} />

      {/* Dress-form head cap */}
      <ellipse cx="130" cy="36" rx="16" ry="20" fill={skin} stroke="#b8927e" strokeWidth="0.55" filter={`url(#skinSoft-${uid})`} />
      <ellipse cx="122" cy="28" rx="8" ry="10" fill="#fff" opacity="0.32" />
      <path d="M 118 44 Q 130 48 142 44" fill="none" stroke="#c4a494" strokeWidth="0.4" opacity="0.5" />

      {/* Neck */}
      <path
        d="M 119 54 Q 130 60 141 54 L 139 74 Q 130 79 121 74 Z"
        fill={skin}
        stroke="#b8927e"
        strokeWidth="0.45"
      />

      {/* Metal neck ring — dress-form collar */}
      <ellipse cx="130" cy="76" rx="22" ry="5" fill={`url(#chromeCollar-${uid})`} stroke="#64748b" strokeWidth="0.5" />
      <ellipse cx="130" cy="75" rx="18" ry="3" fill="#f8fafc" opacity="0.45" />

      {/* Shoulder domes — characteristic dress-form caps */}
      <ellipse cx="58" cy="84" rx="14" ry="8" fill={skin} stroke="#c4a494" strokeWidth="0.35" opacity="0.85" />
      <ellipse cx="202" cy="84" rx="14" ry="8" fill={skin} stroke="#c4a494" strokeWidth="0.35" opacity="0.85" />

      {/* Torso shell under fabric */}
      <path
        d="M 64 82
           C 48 86 38 98 34 114
           C 30 130 32 150 38 170
           C 44 190 52 208 62 224
           C 72 240 84 254 98 264
           L 114 272 L 130 274 L 146 272
           L 162 264 C 176 254 188 240 198 224
           C 208 208 216 190 222 170
           C 228 150 230 130 226 114
           C 222 98 212 86 196 82
           C 174 76 156 74 130 74
           C 104 74 86 76 64 82 Z"
        fill={skin}
        stroke="#c4a494"
        strokeWidth="0.35"
        opacity="0.48"
      />

      {/* Fitted blouse bodice */}
      <path
        d="M 56 82
           C 38 88 28 104 24 122
           C 20 140 22 158 28 176
           C 34 194 42 210 52 224
           C 62 238 74 250 88 260
           L 106 268 L 130 270 L 154 268
           L 172 260 C 186 250 198 238 208 224
           C 218 210 226 194 232 176
           C 238 158 240 140 236 122
           C 232 104 222 88 204 82
           C 180 76 154 74 130 74
           C 106 74 80 76 56 82 Z"
        fill={blouseFill}
        stroke="#500724"
        strokeWidth="0.85"
        filter={`url(#fabricDepth-${uid})`}
      />
      <path d="M 56 82 L 204 82" fill={`url(#fabricWeave-${uid})`} opacity="0.65" clipPath={`url(#blouseClip-${uid})`} />

      {/* Bust cups — dress-form shaping */}
      <path
        d="M 86 96 C 74 106 68 118 66 128 C 78 134 94 130 102 118 C 98 106 92 100 86 96"
        fill="#fff"
        opacity="0.16"
      />
      <path
        d="M 174 96 C 186 106 192 118 194 128 C 182 134 166 130 158 118 C 162 106 168 100 174 96"
        fill="#fff"
        opacity="0.16"
      />
      <path
        d="M 86 96 C 74 106 68 118 66 128 C 78 134 94 130 102 118 C 98 106 92 100 86 96"
        fill="none"
        stroke="#881337"
        strokeWidth="0.35"
        opacity="0.35"
      />
      <path
        d="M 174 96 C 186 106 192 118 194 128 C 182 134 166 130 158 118 C 162 106 168 100 174 96"
        fill="none"
        stroke="#881337"
        strokeWidth="0.35"
        opacity="0.35"
      />

      {/* Waist cinch shadow */}
      <path d="M 70 200 Q 130 188 190 200 Q 130 214 70 200" fill="#000" opacity="0.08" />

      {/* Square neckline */}
      <path d="M 104 82 L 104 98 L 156 98 L 156 82 Z" fill={skin} stroke="#881337" strokeWidth="0.65" />
      <path d="M 108 82 L 108 94 L 152 94 L 152 82 Z" fill="#fff" opacity="0.12" />

      {/* Fabric sheen & fold lines */}
      <path
        d="M 130 94 Q 88 108 72 128 Q 80 172 92 212 Q 130 228 168 212 Q 180 172 188 128 Q 172 108 130 94"
        fill="#fff"
        opacity="0.11"
      />
      <path d="M 130 108 L 130 248" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.08" />

      {/* Structured sleeves */}
      <path
        d="M 24 122 C 16 134 10 152 6 172 L 2 192 L 10 198 L 16 176 C 22 154 28 136 34 124 Z"
        fill={blouseFill}
        stroke="#500724"
        strokeWidth="0.65"
      />
      <path
        d="M 236 122 C 244 134 250 152 254 172 L 258 192 L 250 198 L 244 176 C 238 154 232 136 226 124 Z"
        fill={blouseFill}
        stroke="#500724"
        strokeWidth="0.65"
      />
      <ellipse cx="8" cy="194" rx="12" ry="7" fill={blouseFill} stroke="#500724" strokeWidth="0.45" />
      <ellipse cx="252" cy="194" rx="12" ry="7" fill={blouseFill} stroke="#500724" strokeWidth="0.45" />
      <path d="M 4 190 Q 8 186 12 190" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.25" />
      <path d="M 256 190 Q 252 186 248 190" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.25" />

      {/* Hip base */}
      <path
        d="M 90 268 Q 130 278 170 268 L 166 284 Q 130 290 94 284 Z"
        fill={skin}
        stroke="#c4a494"
        strokeWidth="0.35"
        opacity="0.42"
      />
    </g>
  );
}

/** Dress-form — back view */
function LadyTorsoBack({ uid, blouseFill }: { uid: string; blouseFill: string }) {
  const skin = `url(#mannequinSkinSide-${uid})`;

  return (
    <g filter={`url(#mannequinShadow-${uid})`}>
      <ShowroomBackdrop uid={uid} />
      <StudioFloor uid={uid} />
      <ellipse cx="130" cy="36" rx="16" ry="20" fill={skin} stroke="#b8927e" strokeWidth="0.55" />
      <path d="M 119 54 Q 130 60 141 54 L 141 74 Q 130 79 119 74 Z" fill={skin} stroke="#b8927e" strokeWidth="0.45" />
      <ellipse cx="130" cy="76" rx="22" ry="5" fill={`url(#chromeCollar-${uid})`} stroke="#64748b" strokeWidth="0.5" />

      <path
        d="M 56 82
           C 38 88 28 104 24 122
           C 20 140 22 158 28 176
           C 34 194 42 210 52 224
           C 62 238 74 250 88 260
           L 106 268 L 130 270 L 154 268
           L 172 260 C 186 250 198 238 208 224
           C 218 210 226 194 232 176
           C 238 158 240 140 236 122
           C 232 104 222 88 204 82
           C 180 76 154 74 130 74
           C 106 74 80 76 56 82 Z"
        fill={blouseFill}
        stroke="#500724"
        strokeWidth="0.85"
        filter={`url(#fabricDepth-${uid})`}
      />

      <path d="M 86 98 Q 96 114 94 132 Q 86 120 86 98" fill="#000" opacity="0.09" />
      <path d="M 174 98 Q 164 114 166 132 Q 174 120 174 98" fill="#000" opacity="0.09" />
      <line x1="130" y1="82" x2="130" y2="262" stroke="#881337" strokeWidth="0.75" opacity="0.45" />
      <path d="M 108 82 Q 130 92 152 82" fill="none" stroke="#881337" strokeWidth="0.55" opacity="0.4" />

      <path d="M 24 122 C 16 134 10 152 6 172 L 2 192 L 10 198 L 16 176 C 22 154 28 136 34 124 Z" fill={blouseFill} stroke="#500724" strokeWidth="0.65" />
      <path d="M 236 122 C 244 134 250 152 254 172 L 258 192 L 250 198 L 244 176 C 238 154 232 136 226 124 Z" fill={blouseFill} stroke="#500724" strokeWidth="0.65" />
    </g>
  );
}

/** Side profile — bust projection & waist curve */
function LadyTorsoSide({ uid, facing }: { uid: string; facing: "left" | "right" }) {
  const skin = `url(#mannequinSkinSide-${uid})`;
  const blouse = `url(#blouseRedSide-${uid})`;
  const mirror = facing === "right" ? "scale(-1,1) translate(-260,0)" : undefined;

  return (
    <g transform={mirror} filter={`url(#mannequinShadow-${uid})`}>
      <ShowroomBackdrop uid={uid} />
      <StudioFloor uid={uid} />

      <ellipse cx="116" cy="36" rx="13" ry="20" fill={skin} stroke="#b8927e" strokeWidth="0.55" />
      <path d="M 106 30 Q 116 26 126 32 Q 120 40 106 36 Z" fill="#fff" opacity="0.24" />
      <path d="M 110 54 Q 118 62 124 72 L 120 78 Q 110 68 106 60 Z" fill={skin} stroke="#b8927e" strokeWidth="0.45" />
      <ellipse cx="118" cy="76" rx="16" ry="4" fill={`url(#chromeCollar-${uid})`} stroke="#64748b" strokeWidth="0.45" opacity="0.9" />

      <path
        d="M 146 82
           C 154 88 158 98 160 112
           C 162 128 160 142 156 158
           C 150 178 138 198 124 218
           C 112 232 100 246 88 258
           L 80 266 L 74 272
           C 70 256 68 238 70 220
           C 74 200 80 180 86 160
           C 90 140 92 120 96 104
           C 100 90 108 82 118 78
           C 128 74 138 76 146 82 Z"
        fill={skin}
        stroke="#c4a494"
        strokeWidth="0.4"
        opacity="0.46"
      />

      <path
        d="M 154 82
           C 164 90 170 104 172 120
           C 174 136 172 152 166 168
           C 158 188 144 208 128 226
           C 114 240 100 254 86 266
           L 80 270
           C 76 252 74 232 76 212
           C 80 192 86 172 92 152
           C 96 132 98 112 102 96
           C 106 86 114 78 124 76
           C 134 74 144 76 154 82 Z"
        fill={blouse}
        stroke="#500724"
        strokeWidth="0.75"
        filter={`url(#fabricDepth-${uid})`}
      />

      <ellipse cx="162" cy="118" rx="11" ry="15" fill="#fff" opacity="0.14" />
      <path d="M 168 108 Q 174 118 172 132" fill="none" stroke="#881337" strokeWidth="0.4" opacity="0.3" />

      <path
        d="M 98 112 C 90 132 82 158 76 182 L 72 198 L 78 202 L 84 182 C 90 158 96 134 104 116 Z"
        fill={blouse}
        stroke="#500724"
        strokeWidth="0.55"
      />
      <ellipse cx="74" cy="200" rx="9" ry="5.5" fill={blouse} stroke="#500724" strokeWidth="0.4" />
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
