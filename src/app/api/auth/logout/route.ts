import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { parseDeviceId } from "@/lib/auth-device";
import { untrustDevice } from "@/lib/trusted-device";

export async function POST(req: Request) {
  const session = await getSession();

  if (session) {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const deviceId = parseDeviceId(body);
      if (deviceId) {
        await untrustDevice(session.id, deviceId);
      }
    } catch {
      /* form POST without JSON body */
    }
  }

  await clearSession();

  const accept = req.headers.get("accept") ?? "";
  const wantsJson =
    accept.includes("application/json") ||
    req.headers.get("x-requested-with") === "XMLHttpRequest" ||
    req.headers.get("content-type")?.includes("application/json");

  if (wantsJson) {
    return NextResponse.json({ ok: true, redirect: "/" });
  }

  // 303 = redirect as GET (307 would repeat POST and break on "/")
  return NextResponse.redirect(new URL("/", req.url), 303);
}
