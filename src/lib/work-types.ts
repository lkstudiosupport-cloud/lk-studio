import type { WorkType } from "@prisma/client";

export const WORK_TYPES: WorkType[] = ["STITCHING", "REPAIR"];

export function workTypeLabelKey(w: WorkType) {
  return `workType.${w.toLowerCase()}`;
}
