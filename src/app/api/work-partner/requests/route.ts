import { NextResponse } from "next/server";
import { listOpenWorkerPartnerRequests } from "@/lib/work-partner-requests";

/** Open worker requests for the work partner app — filter by role and/or city. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requests = await listOpenWorkerPartnerRequests({
      role: searchParams.get("role"),
      city: searchParams.get("city"),
    });

    return NextResponse.json(
      {
        ok: true,
        requests: requests.map((r) => ({
          id: r.id,
          role: r.role,
          customRole: r.customRole,
          neededFrom: r.neededFrom.toISOString().slice(0, 10),
          durationType: r.durationType,
          customDays: r.customDays,
          notes: r.notes,
          city: r.city ?? r.shop.city,
          createdAt: r.createdAt.toISOString(),
          shop: r.shop,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[lk-studio] work-partner requests API error:", err);
    return NextResponse.json({ ok: false, requests: [] }, { status: 500 });
  }
}
