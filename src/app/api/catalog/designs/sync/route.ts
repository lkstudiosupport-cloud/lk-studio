import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildCatalogSyncResponse } from "@/lib/catalog-sync-api";

export const runtime = "nodejs";

/**
 * Incremental catalog design sync for cache-first clients (IndexedDB).
 * GET /api/catalog/designs/sync?version=N&page=1
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "SHOP" && session.role !== "CUSTOMER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const versionRaw = Number.parseInt(searchParams.get("version") ?? "0", 10);
  const version = Number.isFinite(versionRaw) && versionRaw >= 0 ? versionRaw : 0;
  const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  try {
    const payload = await buildCatalogSyncResponse(version, page);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[catalog/designs/sync]", err);
    return NextResponse.json({ error: "Could not sync designs" }, { status: 503 });
  }
}
