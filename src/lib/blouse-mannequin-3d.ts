import type { MeasurementFieldKey } from "@/lib/measurements";

export type Blouse3DMeasureLine = {
  key: MeasurementFieldKey;
  num: string;
  views: ("front" | "back")[];
  from: [number, number, number];
  to: [number, number, number];
  label: [number, number, number];
};

/** 3D anchors on lady dress-form (Y up, facing +Z front) */
export const BLOUSE_3D_MEASURE_LINES: Blouse3DMeasureLine[] = [
  {
    key: "shoulder",
    num: "1",
    views: ["front", "back"],
    from: [-0.26, 0.36, 0.04],
    to: [0.26, 0.36, 0.04],
    label: [0, 0.4, 0.14],
  },
  {
    key: "armHole",
    num: "2",
    views: ["front"],
    from: [-0.24, 0.36, 0.02],
    to: [-0.24, 0.28, 0.06],
    label: [-0.3, 0.32, 0.1],
  },
  {
    key: "chest",
    num: "3",
    views: ["front"],
    from: [-0.22, 0.26, 0.1],
    to: [0.22, 0.26, 0.1],
    label: [0, 0.22, 0.16],
  },
  {
    key: "waist",
    num: "4",
    views: ["front", "back"],
    from: [-0.17, 0.12, 0.06],
    to: [0.17, 0.12, 0.06],
    label: [0, 0.08, 0.14],
  },
  {
    key: "blouseLen",
    num: "5",
    views: ["front"],
    from: [0.2, 0.36, 0.05],
    to: [0.2, 0.1, 0.05],
    label: [0.28, 0.22, 0.12],
  },
  {
    key: "armLength",
    num: "6",
    views: ["front"],
    from: [-0.26, 0.34, 0.02],
    to: [-0.34, 0.02, 0.04],
    label: [-0.38, 0.18, 0.1],
  },
  {
    key: "sleeve",
    num: "7",
    views: ["front"],
    from: [-0.36, 0.04, 0.05],
    to: [-0.3, 0.04, 0.05],
    label: [-0.38, 0.04, 0.12],
  },
];

export function blouse3DViewSide(rotationDeg: number): "front" | "back" | "side" {
  const n = ((rotationDeg % 360) + 360) % 360;
  if (n < 50 || n >= 310) return "front";
  if (n >= 130 && n < 230) return "back";
  return "side";
}
