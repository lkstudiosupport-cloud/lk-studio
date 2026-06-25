import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  refreshSession,
  readSessionToken,
  SESSION_REFRESH_MIN_INTERVAL_SEC,
} from "@/lib/auth";

export async function POST() {
  try {
    const read = await readSessionToken();
    if (!read) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { session, issuedAtSec } = read;
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      issuedAtSec != null &&
      nowSec - issuedAtSec < SESSION_REFRESH_MIN_INTERVAL_SEC
    ) {
      return NextResponse.json({ ok: true, refreshed: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { sessionVersion: true, role: true, email: true, name: true, shopProfile: { select: { id: true } } },
    });

    if (!user || user.role !== session.role) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    if ((session.sessionVersion ?? 0) !== user.sessionVersion) {
      return NextResponse.json({ ok: false, reason: "session_revoked" }, { status: 401 });
    }

    await refreshSession({
      id: session.id,
      email: user.email,
      name: user.name,
      role: user.role,
      shopId: user.shopProfile?.id,
      sessionVersion: user.sessionVersion,
    });

    return NextResponse.json({ ok: true, refreshed: true });
  } catch (err) {
    console.error("Session refresh error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
