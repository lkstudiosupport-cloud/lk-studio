import React, { type ReactNode } from "react";
import type { MeasurementFieldKey, MeasurementTypeId } from "@/lib/measurements";
import { isCircumferenceField } from "@/lib/measurement-field-guide";

const STROKE = "#141414";
const SKIN = "#e8b4a0";
const SKIN_LIGHT = "#f0c9b8";
const SW = 0.85;
const SW_ACTIVE = 1.15;

const GARMENT = {
  blouse: { main: "#ec4899", light: "#f9a8d4" },
  dress: { main: "#14b8a6", light: "#5eead4" },
  child: { top: "#3b82f6", shorts: "#1e40af" },
} as const;

function strokeW(active?: boolean) {
  return active ? SW_ACTIVE : SW;
}

function MeasureArrow({ id }: { id: string }) {
  return (
    <marker id={id} markerWidth="4" markerHeight="4" refX="3.2" refY="2" orient="auto">
      <path d="M0,0 L4,2 L0,4 Z" fill={STROKE} />
    </marker>
  );
}

function VLine({
  x,
  y1,
  y2,
  active,
  arrowId,
}: {
  x: number;
  y1: number;
  y2: number;
  active?: boolean;
  arrowId: string;
}) {
  return (
    <line
      x1={x}
      y1={y1}
      x2={x}
      y2={y2}
      stroke={STROKE}
      strokeWidth={strokeW(active)}
      markerStart={`url(#${arrowId}-start)`}
      markerEnd={`url(#${arrowId})`}
    />
  );
}

function HLine({
  x1,
  x2,
  y,
  active,
  arrowId,
}: {
  x1: number;
  x2: number;
  y: number;
  active?: boolean;
  arrowId: string;
}) {
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={STROKE}
      strokeWidth={strokeW(active)}
      markerStart={`url(#${arrowId}-start)`}
      markerEnd={`url(#${arrowId})`}
    />
  );
}

function EllipseBand({
  cx,
  cy,
  rx,
  ry,
  active,
  dashed,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  active?: boolean;
  dashed?: boolean;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      stroke={STROKE}
      strokeWidth={strokeW(active)}
      strokeDasharray={dashed && !active ? "2.5 1.8" : undefined}
    />
  );
}

function ArcBand({
  cx,
  cy,
  rx,
  ry,
  active,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  active?: boolean;
}) {
  return (
    <path
      d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy}`}
      fill="none"
      stroke={STROKE}
      strokeWidth={strokeW(active)}
    />
  );
}

function SceneZoom({ children, scale = 1, tx = 0, ty = 0 }: { children: ReactNode; scale?: number; tx?: number; ty?: number }) {
  return (
    <g transform={`translate(${tx} ${ty}) scale(${scale}) translate(${-tx} ${-ty})`}>{children}</g>
  );
}

function BlouseFront({ showHead = true }: { showHead?: boolean }) {
  const g = GARMENT.blouse;
  return (
    <>
      <path
        d="M 10 24 C 8 32 7 42 8 52 C 9 62 11 70 14 76"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 62 24 C 64 32 65 42 64 52 C 63 62 61 70 58 76"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 18 22 L 28 18 L 28 14 L 44 14 L 44 18 L 54 22
           C 57 30 57 40 55 50 C 53 60 49 68 42 74 C 38 78 34 78 30 74
           C 23 68 19 60 17 50 C 15 40 15 30 18 22 Z"
        fill={g.main}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M 28 14 L 28 18 L 44 18 L 44 14 Z" fill={g.light} stroke={STROKE} strokeWidth={SW} />
      {showHead && <ellipse cx="36" cy="9" rx="6.5" ry="7.5" fill={SKIN_LIGHT} stroke={STROKE} strokeWidth={SW} />}
      <path d="M 32 14 Q 36 16 40 14" fill="none" stroke={STROKE} strokeWidth={0.6} opacity="0.35" />
    </>
  );
}

function BlouseBack({ showHead = true }: { showHead?: boolean }) {
  const g = GARMENT.blouse;
  return (
    <>
      <path
        d="M 10 26 C 8 36 8 48 10 58 C 12 68 14 74 16 78"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 62 26 C 64 36 64 48 62 58 C 60 68 58 74 56 78"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 18 22 L 28 18 L 30 14 Q 36 17 42 14 L 44 18 L 54 22
           C 57 30 57 40 55 50 C 53 60 49 68 42 74 C 38 78 34 78 30 74
           C 23 68 19 60 17 50 C 15 40 15 30 18 22 Z"
        fill={g.main}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {showHead && <ellipse cx="36" cy="9" rx="6.5" ry="7.5" fill={SKIN_LIGHT} stroke={STROKE} strokeWidth={SW} />}
    </>
  );
}

function DressFront({ showLegs = true }: { showLegs?: boolean }) {
  const g = GARMENT.dress;
  return (
    <>
      <path
        d="M 8 26 C 6 38 5 52 6 66 C 7 78 9 86 12 92"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 64 26 C 66 38 67 52 66 66 C 65 78 63 86 60 92"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 18 22 L 28 18 L 28 14 L 44 14 L 44 18 L 54 22
           C 58 32 60 46 59 60 C 58 72 55 82 50 90 L 36 94 L 22 90
           C 17 82 14 72 13 60 C 12 46 14 32 18 22 Z"
        fill={g.main}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <ellipse cx="36" cy="9" rx="6.5" ry="7.5" fill={SKIN_LIGHT} stroke={STROKE} strokeWidth={SW} />
      <path d="M 28 14 L 28 18 L 44 18 L 44 14 Z" fill={g.light} stroke={STROKE} strokeWidth={SW} />
      {showLegs && (
        <>
          <path d="M 30 94 L 28 108 M 42 94 L 44 108" stroke={STROKE} strokeWidth={0.7} opacity="0.4" />
          <path d="M 28 108 L 26 118 M 44 108 L 46 118" stroke={STROKE} strokeWidth={0.7} opacity="0.35" />
        </>
      )}
    </>
  );
}

function ChildFront({ showLegs = true }: { showLegs?: boolean }) {
  const g = GARMENT.child;
  return (
    <>
      <path
        d="M 12 26 C 10 36 9 48 10 58 C 11 66 13 72 15 76"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 60 26 C 62 36 63 48 62 58 C 61 66 59 72 57 76"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M 20 24 L 28 20 L 28 16 L 44 16 L 44 20 L 52 24
           C 54 34 54 46 52 56 C 50 64 46 70 40 74 C 36 76 32 76 28 74
           C 22 70 18 64 16 56 C 14 46 14 34 20 24 Z"
        fill={g.top}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M 22 56 C 20 62 20 68 22 74 L 28 78 L 44 78 L 50 74 C 52 68 52 62 50 56 Z"
        fill={g.shorts}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <ellipse cx="36" cy="10" rx="7" ry="8" fill={SKIN_LIGHT} stroke={STROKE} strokeWidth={SW} />
      <path d="M 28 16 L 28 20 L 44 20 L 44 16 Z" fill={SKIN_LIGHT} stroke={STROKE} strokeWidth={SW} />
      {showLegs && (
        <>
          <path d="M 28 78 L 26 92 M 44 78 L 46 92" stroke={STROKE} strokeWidth={0.7} opacity="0.4" />
          <path d="M 26 92 L 24 102 M 46 92 L 48 102" stroke={STROKE} strokeWidth={0.7} opacity="0.35" />
        </>
      )}
    </>
  );
}

function ArmCloseUp({ garmentColor }: { garmentColor: string }) {
  return (
    <>
      <path
        d="M 48 14 C 52 14 54 18 52 22 L 54 26
           C 58 32 60 42 58 52 C 56 62 52 72 48 82 C 44 90 40 94 36 94"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M 50 28 C 54 36 55 48 53 58 C 51 68 47 78 42 86"
        fill={garmentColor}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
        opacity="0.85"
      />
      <ellipse cx="50" cy="16" rx="5" ry="6" fill={SKIN_LIGHT} stroke={STROKE} strokeWidth={SW} />
    </>
  );
}

function SideTorso({ garmentColor }: { garmentColor: string }) {
  return (
    <>
      <ellipse cx="44" cy="12" rx="5" ry="6" fill={SKIN_LIGHT} stroke={STROKE} strokeWidth={SW} />
      <path
        d="M 44 16 C 48 18 50 24 48 30 L 50 34
           C 54 42 55 54 52 66 C 49 76 44 84 38 90 L 42 92 L 46 90"
        fill={garmentColor}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M 48 24 C 44 32 42 44 40 56 C 38 68 36 78 34 86"
        fill={SKIN}
        stroke={STROKE}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity="0.9"
      />
    </>
  );
}

function NeckCloseUp({ garmentColor }: { garmentColor: string }) {
  return (
    <>
      <ellipse cx="36" cy="14" rx="10" ry="11" fill={SKIN_LIGHT} stroke={STROKE} strokeWidth={SW} />
      <path
        d="M 28 22 L 28 26 L 44 26 L 44 22 Z"
        fill={garmentColor}
        stroke={STROKE}
        strokeWidth={SW}
      />
      <path d="M 30 22 Q 36 28 42 22" fill="none" stroke={STROKE} strokeWidth={0.7} opacity="0.4" />
    </>
  );
}

function SceneDefs({ arrowId }: { arrowId: string }) {
  return (
    <defs>
      <MeasureArrow id={arrowId} />
      <marker id={`${arrowId}-start`} markerWidth="4" markerHeight="4" refX="0.8" refY="2" orient="auto-start-reverse">
        <path d="M4,0 L0,2 L4,4 Z" fill={STROKE} />
      </marker>
    </defs>
  );
}

function wrapScene(content: ReactNode, arrowId: string) {
  return (
    <>
      <SceneDefs arrowId={arrowId} />
      {content}
    </>
  );
}

function blouseScene(field: MeasurementFieldKey, active?: boolean): ReactNode {
  const id = `bl-${field}`;
  switch (field) {
    case "shoulder":
      return wrapScene(
        <SceneZoom scale={1.45} tx={36} ty={22}>
          <BlouseBack showHead={false} />
          <HLine x1={14} x2={58} y={20} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "armHole":
      return wrapScene(
        <SceneZoom scale={1.35} tx={36} ty={28}>
          <BlouseFront showHead={false} />
          <ArcBand cx={36} cy={26} rx={18} ry={6} active={active} />
        </SceneZoom>,
        id
      );
    case "chest":
      return wrapScene(
        <SceneZoom scale={1.4} tx={36} ty={36}>
          <BlouseFront showHead={false} />
          <EllipseBand cx={36} cy={36} rx={16} ry={5} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "waist":
      return wrapScene(
        <SceneZoom scale={1.4} tx={36} ty={48}>
          <BlouseFront showHead={false} />
          <EllipseBand cx={36} cy={50} rx={13} ry={4} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "blouseLen":
      return wrapScene(
        <>
          <BlouseFront />
          <VLine x={52} y1={18} y2={74} active={active} arrowId={id} />
        </>,
        id
      );
    case "armLength":
      return wrapScene(
        <SceneZoom scale={1.55} tx={14} ty={48}>
          <BlouseFront showHead={false} />
          <VLine x={10} y1={24} y2={74} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "sleeve":
      return wrapScene(
        <SceneZoom scale={1.7} tx={48} ty={52}>
          <ArmCloseUp garmentColor={GARMENT.blouse.main} />
          <EllipseBand cx={52} cy={54} rx={8} ry={3} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "custom":
    default:
      return wrapScene(<BlouseFront />, id);
  }
}

function dressScene(field: MeasurementFieldKey, active?: boolean): ReactNode {
  const id = `dr-${field}`;
  switch (field) {
    case "neck":
      return wrapScene(
        <SceneZoom scale={1.8} tx={36} ty={18}>
          <NeckCloseUp garmentColor={GARMENT.dress.light} />
          <EllipseBand cx={36} cy={22} rx={9} ry={4} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "overBust":
      return wrapScene(
        <SceneZoom scale={1.35} tx={36} ty={30}>
          <DressFront showLegs={false} />
          <EllipseBand cx={36} cy={30} rx={17} ry={4.5} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "bust":
      return wrapScene(
        <SceneZoom scale={1.35} tx={36} ty={36}>
          <DressFront showLegs={false} />
          <EllipseBand cx={36} cy={36} rx={17} ry={5} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "underBust":
      return wrapScene(
        <SceneZoom scale={1.35} tx={36} ty={42}>
          <DressFront showLegs={false} />
          <EllipseBand cx={36} cy={44} rx={15} ry={4} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "waist":
      return wrapScene(
        <SceneZoom scale={1.35} tx={36} ty={50}>
          <DressFront showLegs={false} />
          <EllipseBand cx={36} cy={52} rx={13} ry={4} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "hip":
      return wrapScene(
        <SceneZoom scale={1.3} tx={36} ty={58}>
          <DressFront showLegs={false} />
          <EllipseBand cx={36} cy={62} rx={16} ry={5} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "length":
      return wrapScene(
        <>
          <DressFront />
          <VLine x={56} y1={14} y2={94} active={active} arrowId={id} />
        </>,
        id
      );
    case "neckToAboveKnee":
      return wrapScene(
        <>
          <DressFront />
          <VLine x={56} y1={14} y2={68} active={active} arrowId={id} />
        </>,
        id
      );
    case "aboveKneeToAnkle":
      return wrapScene(
        <SceneZoom scale={1.25} tx={36} ty={82}>
          <DressFront />
          <VLine x={56} y1={68} y2={94} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "armLength":
      return wrapScene(
        <SceneZoom scale={1.55} tx={10} ty={48}>
          <DressFront showLegs={false} />
          <VLine x={8} y1={24} y2={78} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "shoulder":
      return wrapScene(
        <SceneZoom scale={1.45} tx={36} ty={22}>
          <DressFront showLegs={false} />
          <HLine x1={14} x2={58} y={20} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "armHole":
      return wrapScene(
        <SceneZoom scale={1.35} tx={36} ty={28}>
          <DressFront showLegs={false} />
          <ArcBand cx={36} cy={26} rx={18} ry={6} active={active} />
        </SceneZoom>,
        id
      );
    case "bicep":
      return wrapScene(
        <SceneZoom scale={1.75} tx={48} ty={38}>
          <ArmCloseUp garmentColor={GARMENT.dress.main} />
          <EllipseBand cx={52} cy={38} rx={7} ry={3} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "foreArm":
      return wrapScene(
        <SceneZoom scale={1.75} tx={46} ty={58}>
          <ArmCloseUp garmentColor={GARMENT.dress.main} />
          <EllipseBand cx={50} cy={58} rx={6} ry={2.5} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "wrist":
      return wrapScene(
        <SceneZoom scale={1.9} tx={42} ty={82}>
          <ArmCloseUp garmentColor={GARMENT.dress.main} />
          <EllipseBand cx={44} cy={84} rx={5} ry={2} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "frontNeck":
      return wrapScene(
        <SceneZoom scale={1.7} tx={36} ty={20}>
          <NeckCloseUp garmentColor={GARMENT.dress.light} />
          <line x1={38} y1={18} x2={36} y2={28} stroke={STROKE} strokeWidth={strokeW(active)} />
        </SceneZoom>,
        id
      );
    case "frontWaist":
      return wrapScene(
        <SceneZoom scale={1.3} tx={30} ty={44}>
          <SideTorso garmentColor={GARMENT.dress.main} />
          <VLine x={24} y1={22} y2={52} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "trouserThreeQuarter":
      return wrapScene(
        <SceneZoom scale={1.2} tx={36} ty={72}>
          <DressFront />
          <VLine x={56} y1={52} y2={82} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "custom":
    default:
      return wrapScene(<DressFront />, id);
  }
}

function childScene(field: MeasurementFieldKey, active?: boolean): ReactNode {
  const id = `ch-${field}`;
  switch (field) {
    case "shoulder":
      return wrapScene(
        <SceneZoom scale={1.45} tx={36} ty={22}>
          <ChildFront showLegs={false} />
          <HLine x1={16} x2={56} y={22} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "chest":
      return wrapScene(
        <SceneZoom scale={1.4} tx={36} ty={34}>
          <ChildFront showLegs={false} />
          <EllipseBand cx={36} cy={34} rx={15} ry={4.5} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "bust":
      return wrapScene(
        <SceneZoom scale={1.4} tx={36} ty={40}>
          <ChildFront showLegs={false} />
          <EllipseBand cx={36} cy={40} rx={14} ry={4} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "waist":
      return wrapScene(
        <SceneZoom scale={1.4} tx={36} ty={50}>
          <ChildFront showLegs={false} />
          <EllipseBand cx={36} cy={52} rx={12} ry={3.5} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "hip":
      return wrapScene(
        <SceneZoom scale={1.35} tx={36} ty={60}>
          <ChildFront showLegs={false} />
          <EllipseBand cx={36} cy={64} rx={14} ry={4} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "blouseLen":
      return wrapScene(
        <SceneZoom scale={1.25} tx={36} ty={44}>
          <ChildFront showLegs={false} />
          <VLine x={54} y1={20} y2={74} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "length":
      return wrapScene(
        <>
          <ChildFront />
          <VLine x={56} y1={10} y2={94} active={active} arrowId={id} />
        </>,
        id
      );
    case "armLength":
      return wrapScene(
        <SceneZoom scale={1.55} tx={14} ty={48}>
          <ChildFront showLegs={false} />
          <VLine x={12} y1={26} y2={74} active={active} arrowId={id} />
        </SceneZoom>,
        id
      );
    case "sleeve":
      return wrapScene(
        <SceneZoom scale={1.7} tx={48} ty={50}>
          <ArmCloseUp garmentColor={GARMENT.child.top} />
          <EllipseBand cx={52} cy={52} rx={7} ry={3} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "neck":
      return wrapScene(
        <SceneZoom scale={1.8} tx={36} ty={18}>
          <NeckCloseUp garmentColor={GARMENT.child.top} />
          <EllipseBand cx={36} cy={22} rx={9} ry={4} active={active} dashed />
        </SceneZoom>,
        id
      );
    case "custom":
    default:
      return wrapScene(<ChildFront />, id);
  }
}

const SCENE_RENDERERS: Record<MeasurementTypeId, (field: MeasurementFieldKey, active?: boolean) => ReactNode> = {
  blouse: blouseScene,
  dress: dressScene,
  child: childScene,
};

/** Unique filled SVG scene per measurement field (72×96 coordinate space). */
export function renderMeasurementFieldScene(
  type: MeasurementTypeId,
  fieldKey: MeasurementFieldKey,
  active?: boolean
): ReactNode {
  return SCENE_RENDERERS[type](fieldKey, active);
}

/** Whether the field uses a circumference-style ellipse indicator in its scene. */
export function fieldUsesCircumferenceIndicator(fieldKey: MeasurementFieldKey): boolean {
  return isCircumferenceField(fieldKey);
}
