import { NextResponse } from "next/server";

/** Lightweight health check for Render — no DB or Supabase. */
export function GET() {
  return NextResponse.json({ ok: true, service: "lk-studio" }, { status: 200 });
}
