import { NextResponse } from "next/server";
import { otpConfigStatus, probeMsg91Widget } from "@/lib/msg91-config";
import { storageBackend } from "@/lib/storage-backend";

/** Lightweight health check for Render — no DB or Supabase network calls. */
export async function GET() {
  const otp = otpConfigStatus();
  const widgetProbe = otp.widgetSend ? await probeMsg91Widget() : null;

  return NextResponse.json(
    {
      ok: true,
      service: "lk-studio",
      storageBackend: storageBackend(),
      otp: {
        ...otp,
        ...(widgetProbe ? { widgetProbe } : {}),
      },
    },
    { status: 200 }
  );
}
