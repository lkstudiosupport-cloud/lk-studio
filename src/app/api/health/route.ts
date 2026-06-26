import { NextResponse } from "next/server";
import { otpConfigStatus } from "@/lib/msg91-config";
import { storageBackend } from "@/lib/storage-backend";

/** Lightweight health check for Render — no DB or Supabase network calls. */
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "lk-studio",
      storageBackend: storageBackend(),
      otp: otpConfigStatus(),
    },
    { status: 200 }
  );
}
