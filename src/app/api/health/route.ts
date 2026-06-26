import { NextResponse } from "next/server";
import { otpConfigStatus, probeMsg91Widget } from "@/lib/msg91-config";
import { resolveMsg91TemplateId } from "@/lib/msg91-template";
import { storageBackend } from "@/lib/storage-backend";

/** Lightweight health check for Render — no DB or Supabase network calls. */
export async function GET() {
  const otp = otpConfigStatus();
  const widgetProbe = otp.widgetSend ? await probeMsg91Widget() : null;
  const resolvedTemplate = Boolean(await resolveMsg91TemplateId());

  return NextResponse.json(
    {
      ok: true,
      service: "lk-studio",
      storageBackend: storageBackend(),
      otp: {
        ...otp,
        resolvedTemplate,
        ...(widgetProbe ? { widgetProbe } : {}),
      },
    },
    { status: 200 }
  );
}
