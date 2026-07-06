import type { WorkerPartnerRole } from "@prisma/client";

export const WORKER_PARTNER_ROLES: WorkerPartnerRole[] = [
  "MAGGAM_WORKER",
  "STITCHING_WORKER",
  "STITCHING_MASTER",
  "OTHER",
];

export function workerPartnerRoleLabelKey(role: WorkerPartnerRole): string {
  const map: Record<WorkerPartnerRole, string> = {
    MAGGAM_WORKER: "workerPartnerRole.maggamWorker",
    STITCHING_WORKER: "workerPartnerRole.stitchingWorker",
    STITCHING_MASTER: "workerPartnerRole.stitchingMaster",
    OTHER: "workerPartnerRole.other",
  };
  return map[role];
}

export function parseWorkerPartnerRole(raw: string | null | undefined): WorkerPartnerRole | null {
  const u = raw?.trim().toUpperCase();
  if (
    u === "MAGGAM_WORKER" ||
    u === "STITCHING_WORKER" ||
    u === "STITCHING_MASTER" ||
    u === "OTHER"
  ) {
    return u;
  }
  return null;
}
