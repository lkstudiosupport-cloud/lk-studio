import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWorkerPartnerRole } from "@/lib/work-partner-roles";
import { normalizeCity } from "@/lib/cities";

/** Open worker requests for the work partner app — filter by role and/or city. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = parseWorkerPartnerRole(searchParams.get("role") ?? undefined);
  const city = normalizeCity(searchParams.get("city"));

  const requests = await prisma.workerPartnerRequest.findMany({
    where: {
      status: "OPEN",
      ...(role ? { role } : {}),
      ...(city ? { city } : {}),
    },
    include: {
      shop: {
        select: {
          shopName: true,
          shopCode: true,
          city: true,
          address: true,
          phone: true,
          whatsapp: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map((r) => ({
      id: r.id,
      role: r.role,
      customRole: r.customRole,
      notes: r.notes,
      city: r.city,
      createdAt: r.createdAt.toISOString(),
      shop: r.shop,
    })),
  });
}
