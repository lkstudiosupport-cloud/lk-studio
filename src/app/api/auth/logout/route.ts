import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  await clearSession();

  const accept = req.headers.get("accept") ?? "";
  const wantsJson =
    accept.includes("application/json") ||
    req.headers.get("x-requested-with") === "XMLHttpRequest";

  if (wantsJson) {
    return NextResponse.json({ ok: true, redirect: "/" });
  }

  // 303 = redirect as GET (307 would repeat POST and break on "/")
  return NextResponse.redirect(new URL("/", req.url), 303);
}
