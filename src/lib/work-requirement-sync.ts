import { randomUUID } from "crypto";
import { Prisma, type WorkerPartnerDurationType, type WorkerPartnerRole } from "@prisma/client";
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
  workerPartnerRequestId: string;
};

export async function loadWorkSubmissionsForShopRequests(
  shopId: string,
  requestIds: string[]
): Promise<WorkSubmissionRow[]> {
  if (requestIds.length === 0) return [];

  const rows = await prisma.$queryRaw<WorkSubmissionRow[]>`
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
      wr."workerPartnerRequestId"
    FROM "WorkSubmission" ws
    JOIN "WorkRequirement" wr ON wr."id" = ws."requirementId"
    JOIN "WorkerProfile" wp ON wp."id" = ws."workerId"
    JOIN "User" u ON u."id" = wp."userId"
    WHERE wr."shopId" = ${shopId}
      AND wr."workerPartnerRequestId" IN (${Prisma.join(requestIds)})
    ORDER BY ws."createdAt" DESC
  `;

  return rows;
}
