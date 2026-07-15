import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeCity } from "@/lib/cities";
import { parseWorkerPartnerRole } from "@/lib/work-partner-roles";

const shopSelect = {
  shopName: true,
  shopCode: true,
  city: true,
  address: true,
  phone: true,
  whatsapp: true,
} as const;

export type OpenWorkerPartnerRequestRow = Prisma.WorkerPartnerRequestGetPayload<{
  include: { shop: { select: typeof shopSelect } };
}>;

/** Open shop requests for the work partner app (optional role / city filters). */
export async function listOpenWorkerPartnerRequests(opts: {
  role?: string | null;
  city?: string | null;
  take?: number;
}): Promise<OpenWorkerPartnerRequestRow[]> {
  const role = parseWorkerPartnerRole(opts.role ?? undefined);
  const city = normalizeCity(opts.city);
  const take = opts.take ?? 100;

  const where: Prisma.WorkerPartnerRequestWhereInput = {
    status: "OPEN",
    ...(role ? { role } : {}),
    ...(city
      ? {
          OR: [{ city }, { shop: { city } }],
        }
      : {}),
  };

  return prisma.workerPartnerRequest.findMany({
    where,
    include: { shop: { select: shopSelect } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
