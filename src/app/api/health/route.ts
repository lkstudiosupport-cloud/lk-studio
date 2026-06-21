import { NextResponse } from "next/server";
import { storageBackend } from "@/lib/storage-backend";

/** Lightweight health check for Render — no DB or Supabase network calls. */
export function GET() {
  return NextResponse.json(
    { ok: true, service: "lk-studio", storageBackend: storageBackend() },
    { status: 200 }
  );
}
