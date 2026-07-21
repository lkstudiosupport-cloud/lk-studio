import { prisma } from "@/lib/prisma";
import { phoneFieldsForRegister } from "@/lib/auth-user";

async function activateWork(submissionId: string, workerId: string, requirementId: string) {
  await prisma.$transaction([
    prisma.$executeRaw`
      UPDATE "WorkSubmission" SET "status" = 'CUSTOMER_ACCEPTED'::"WorkSubmissionStatus", "updatedAt" = NOW()
      WHERE "id" = ${submissionId}
    `,
    prisma.$executeRaw`
      UPDATE "WorkRequirement" SET "status" = 'IN_PROGRESS'::"WorkRequirementStatus", "updatedAt" = NOW()
      WHERE "id" = ${requirementId}
    `,
    prisma.$executeRaw`
      UPDATE "WorkerProfile" SET "jobsActive" = "jobsActive" + 1, "updatedAt" = NOW()
      WHERE "id" = ${workerId}
    `,
  ]);
}

async function rejectOtherApplications(requirementId: string, acceptedSubmissionId: string) {
  await prisma.$executeRaw`
    UPDATE "WorkSubmission"
    SET "status" = 'REJECTED'::"WorkSubmissionStatus", "updatedAt" = NOW()
    WHERE "requirementId" = ${requirementId}
      AND "id" != ${acceptedSubmissionId}
      AND "status" IN ('APPLIED'::"WorkSubmissionStatus", 'SUBMITTED'::"WorkSubmissionStatus")
  `;
}

type SubmissionRow = {
  id: string;
  status: string;
  requirementId: string;
  workerId: string;
  shopId: string;
  customerId: string | null;
  workerPartnerRequestId: string | null;
  workerName: string;
  workerPhone: string | null;
  workerCity: string;
};

async function loadSubmission(submissionId: string): Promise<SubmissionRow | null> {
  const rows = await prisma.$queryRaw<SubmissionRow[]>`
    SELECT
      ws."id",
      ws."status",
      ws."requirementId",
      ws."workerId",
      wr."shopId",
      wr."customerId",
      wr."workerPartnerRequestId",
      u."name" AS "workerName",
      u."phone" AS "workerPhone",
      wp."city" AS "workerCity"
    FROM "WorkSubmission" ws
    JOIN "WorkRequirement" wr ON wr."id" = ws."requirementId"
    JOIN "WorkerProfile" wp ON wp."id" = ws."workerId"
    JOIN "User" u ON u."id" = wp."userId"
    WHERE ws."id" = ${submissionId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function syncPartnerRequestFilled(params: {
  workerPartnerRequestId: string;
  workerName: string;
  workerPhone: string | null;
  workerCity: string;
}) {
  const phoneRaw = params.workerPhone ?? "";
  const phoneFields = phoneFieldsForRegister(phoneRaw);
  if (!phoneFields.phoneNormalized) return;

  const partner = await prisma.workPartnerProfile.upsert({
    where: { phoneNormalized: phoneFields.phoneNormalized },
    create: {
      name: params.workerName,
      phone: phoneFields.phone ?? phoneRaw,
      phoneNormalized: phoneFields.phoneNormalized,
      city: params.workerCity,
    },
    update: {
      name: params.workerName,
      city: params.workerCity,
    },
    select: { id: true },
  });

  await prisma.workerPartnerRequest.updateMany({
    where: { id: params.workerPartnerRequestId, status: "OPEN" },
    data: {
      status: "FILLED",
      acceptedPartnerId: partner.id,
      acceptedAt: new Date(),
    },
  });
}

export async function shopAcceptWorkerApplication(submissionId: string, shopId: string) {
  const submission = await loadSubmission(submissionId);
  if (!submission) throw new Error("Application not found");
  if (submission.shopId !== shopId) throw new Error("Forbidden");
  if (!["APPLIED", "SUBMITTED"].includes(submission.status)) {
    throw new Error("Cannot accept this application");
  }

  await rejectOtherApplications(submission.requirementId, submission.id);

  if (submission.customerId) {
    await prisma.$executeRaw`
      UPDATE "WorkSubmission"
      SET "status" = 'SHOP_ACCEPTED'::"WorkSubmissionStatus", "updatedAt" = NOW()
      WHERE "id" = ${submission.id}
    `;
  } else {
    await activateWork(submission.id, submission.workerId, submission.requirementId);
  }

  if (submission.workerPartnerRequestId) {
    await syncPartnerRequestFilled({
      workerPartnerRequestId: submission.workerPartnerRequestId,
      workerName: submission.workerName,
      workerPhone: submission.workerPhone,
      workerCity: submission.workerCity,
    });
  }
}

export async function shopRejectWorkerApplication(submissionId: string, shopId: string) {
  const submission = await loadSubmission(submissionId);
  if (!submission) throw new Error("Application not found");
  if (submission.shopId !== shopId) throw new Error("Forbidden");

  await prisma.$executeRaw`
    UPDATE "WorkSubmission"
    SET "status" = 'REJECTED'::"WorkSubmissionStatus", "updatedAt" = NOW()
    WHERE "id" = ${submission.id}
  `;
}
