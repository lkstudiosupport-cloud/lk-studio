import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/safe-db";

/** DB + schema probe for production debugging (not used by Render health check). */
export async function GET() {
  try {
    await withDbRetry(async () => {
      await prisma.$queryRawUnsafe(`SELECT "city", "autopayEnabled" FROM "User" LIMIT 1;`);
      await prisma.$queryRawUnsafe(
        `SELECT "city", "autopayEnabled" FROM "ShopProfile" LIMIT 1;`
      );
    }, 2);
    return NextResponse.json({ ok: true, db: true, schema: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[lk-studio] health/db failed:", err);
    return NextResponse.json({ ok: false, db: false, error: message }, { status: 503 });
  }
}
