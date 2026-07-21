import type { WorkerPartnerRole } from "@prisma/client";

/** Roles shops can pick when raising a request (and partner app filters). */
export const WORKER_PARTNER_ROLES: WorkerPartnerRole[] = [
  "MAGGAM_WORKER",
  "MACHINE_EMBROIDERY",
  "STITCHING_WORKER",
  "CUTTING_MASTER",
];

const ROLE_LABEL_KEYS: Record<WorkerPartnerRole, string> = {
  MAGGAM_WORKER: "workerPartnerRole.maggamWorker",
  MACHINE_EMBROIDERY: "workerPartnerRole.machineEmbroidery",
  STITCHING_WORKER: "workerPartnerRole.stitchingWorker",
  CUTTING_MASTER: "workerPartnerRole.cuttingMaster",
  STITCHING_MASTER: "workerPartnerRole.stitchingMaster",
  OTHER: "workerPartnerRole.other",
};

export function workerPartnerRoleLabelKey(role: WorkerPartnerRole | string): string {
  return ROLE_LABEL_KEYS[role as WorkerPartnerRole] ?? "workerPartnerRole.other";
}

export function parseWorkerPartnerRole(raw: string | null | undefined): WorkerPartnerRole | null {
  const u = raw?.trim().toUpperCase();
  if (
    u === "MAGGAM_WORKER" ||
    u === "MACHINE_EMBROIDERY" ||
    u === "STITCHING_WORKER" ||
    u === "CUTTING_MASTER" ||
    u === "STITCHING_MASTER" ||
    u === "OTHER"
  ) {
    return u;
  }
  return null;
}

export function isSelectableWorkerPartnerRole(role: string): role is WorkerPartnerRole {
  return (WORKER_PARTNER_ROLES as string[]).includes(role);
}
