import { type NextRequest, NextResponse } from "next/server";

import { APP_SURFACE_COOKIE, parseAppSurface } from "@/lib/app-surface";
import { updateSession } from "@/utils/supabase/middleware";

function withAppSurface(request: NextRequest, response: NextResponse) {
  const path = request.nextUrl.pathname;
  const appParam = request.nextUrl.searchParams.get("app");

  if (path.startsWith("/work-partner") || appParam === "partner") {
    response.cookies.set(APP_SURFACE_COOKIE, "partner", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } else if (appParam === "studio") {
    response.cookies.set(APP_SURFACE_COOKIE, "studio", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // Partner shell should never land on Studio home with shop/customer logins.
  if (request.nextUrl.pathname === "/") {
    const surface = parseAppSurface(request.cookies.get(APP_SURFACE_COOKIE)?.value);
    const appParam = request.nextUrl.searchParams.get("app");
    if (surface === "partner" || appParam === "partner") {
      const url = request.nextUrl.clone();
      url.pathname = "/work-partner";
      url.searchParams.delete("app");
      const redirect = NextResponse.redirect(url);
      redirect.cookies.set(APP_SURFACE_COOKIE, "partner", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return redirect;
    }
  }

  const sessionResponse = await updateSession(request);
  return withAppSurface(request, sessionResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health|api/media|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
