import { randomUUID } from "crypto";
import type { WorkerPartnerDurationType, WorkerPartnerRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatWorkerPartnerSchedule } from "@/lib/work-partner-duration";

const ROLE_TO_SKILL: Record<string, string> = {
  MAGGAM_WORKER: "MAGGAM",
  MACHINE_EMBROIDERY: "MACHINE_EMBROIDERY",
  STITCHING_WORKER: "STITCHING",
  CUTTING_MASTER: "CUTTING_MASTER",
  STITCHING_MASTER: "STITCHING",
};

function roleTitle(role: WorkerPartnerRole) {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Create a WorkRequirement in the partner app when shop posts from lk-studio. */
export async function createWorkRequirementForPartnerRequest(params: {
  shopId: string;
  shopName: string;
  workerPartnerRequestId: string;
  role: WorkerPartnerRole;
  city: string;
  notes: string | null;
  neededFrom: Date;
  durationType: WorkerPartnerDurationType;
  customDays: number | null;
}) {
  const skill = ROLE_TO_SKILL[params.role] ?? "STITCHING";
  const title = `${params.shopName} — ${roleTitle(params.role)}`;
  const specifications = formatWorkerPartnerSchedule(
    params.neededFrom.toISOString().slice(0, 10),
    params.durationType,
    params.customDays,
    "en"
  );
  const id = randomUUID();
  const now = new Date();

  await prisma.$executeRaw`
    INSERT INTO "WorkRequirement" (
      "id", "shopId", "title", "description", "specifications",
      "skill", "city", "status", "workerPartnerRequestId", "createdAt", "updatedAt"
    )
    VALUES (
      ${id},
      ${params.shopId},
      ${title},
      ${params.notes},
      ${specifications},
      ${skill}::"WorkerSkill",
      ${params.city},
      'OPEN'::"WorkRequirementStatus",
      ${params.workerPartnerRequestId},
      ${now},
      ${now}
    )
  `;

  return id;
}

export async function cancelWorkRequirementForPartnerRequest(workerPartnerRequestId: string) {
  await prisma.$executeRaw`
    UPDATE "WorkRequirement"
    SET "status" = 'CANCELLED'::"WorkRequirementStatus", "updatedAt" = NOW()
    WHERE "workerPartnerRequestId" = ${workerPartnerRequestId}
      AND "status" = 'OPEN'::"WorkRequirementStatus"
  `;
}

const SKILL_TO_ROLE: Record<string, WorkerPartnerRole> = {
  MAGGAM: "MAGGAM_WORKER",
  MACHINE_EMBROIDERY: "MACHINE_EMBROIDERY",
  STITCHING: "STITCHING_WORKER",
  CUTTING_MASTER: "CUTTING_MASTER",
};

export type ShopWorkRequirementRow = {
  id: string;
  title: string;
  description: string | null;
  specifications: string | null;
  skill: string;
  city: string;
  status: string;
  createdAt: Date;
  workerPartnerRequestId: string | null;
};

export async function loadWorkRequirementsForShop(shopId: string): Promise<ShopWorkRequirementRow[]> {
  return prisma.$queryRaw<ShopWorkRequirementRow[]>`
    SELECT
      "id",
      "title",
      "description",
      "specifications",
      "skill"::text AS "skill",
      "city",
      "status"::text AS "status",
      "createdAt",
      "workerPartnerRequestId"
    FROM "WorkRequirement"
    WHERE "shopId" = ${shopId}
      AND "status" NOT IN ('CANCELLED'::"WorkRequirementStatus")
    ORDER BY "createdAt" DESC
    LIMIT 40
  `;
}

export function skillToWorkerPartnerRole(skill: string): WorkerPartnerRole {
  return SKILL_TO_ROLE[skill] ?? "STITCHING_WORKER";
}

export function mapRequirementStatusToShop(
  status: string
): "OPEN" | "FILLED" | "CANCELLED" {
  if (status === "OPEN") return "OPEN";
  if (status === "IN_PROGRESS" || status === "COMPLETED") return "FILLED";
  return "CANCELLED";
}

export async function cancelWorkRequirementById(requirementId: string, shopId: string) {
  await prisma.$executeRaw`
    UPDATE "WorkRequirement"
    SET "status" = 'CANCELLED'::"WorkRequirementStatus", "updatedAt" = NOW()
    WHERE "id" = ${requirementId}
      AND "shopId" = ${shopId}
      AND "status" = 'OPEN'::"WorkRequirementStatus"
  `;
}

export type WorkSubmissionRow = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  workerId: string;
  workerName: string;
  workerPhone: string | null;
  workerCity: string;
  jobsCompleted: number;
  ratingQualityAvg: number | null;
  ratingPerformanceAvg: number | null;
  profilePhoto: string | null;
  workerPartnerRequestId: string | null;
  requirementId: string;
};

export async function loadWorkSubmissionsForShop(shopId: string): Promise<WorkSubmissionRow[]> {
  return prisma.$queryRaw<WorkSubmissionRow[]>`
    SELECT
      ws."id",
      ws."status",
      ws."notes",
      ws."createdAt",
      wp."id" AS "workerId",
      u."name" AS "workerName",
      u."phone" AS "workerPhone",
      wp."city" AS "workerCity",
      wp."jobsCompleted",
      wp."ratingQualityAvg",
      wp."ratingPerformanceAvg",
      u."profilePhoto",
      wr."workerPartnerRequestId",
      wr."id" AS "requirementId"
    FROM "WorkSubmission" ws
    JOIN "WorkRequirement" wr ON wr."id" = ws."requirementId"
    JOIN "WorkerProfile" wp ON wp."id" = ws."workerId"
    JOIN "User" u ON u."id" = wp."userId"
    WHERE wr."shopId" = ${shopId}
      AND wr."status" NOT IN ('CANCELLED'::"WorkRequirementStatus")
    ORDER BY ws."createdAt" DESC
  `;
}

/** @deprecated use loadWorkSubmissionsForShop */
export async function loadWorkSubmissionsForShopRequests(
  shopId: string,
  requestIds: string[]
): Promise<WorkSubmissionRow[]> {
  if (requestIds.length === 0) return [];
  const all = await loadWorkSubmissionsForShop(shopId);
  const idSet = new Set(requestIds);
  return all.filter(
    (r) => r.workerPartnerRequestId && idSet.has(r.workerPartnerRequestId)
  );
}
