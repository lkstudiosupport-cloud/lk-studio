import { SignJWT, jwtVerify } from "jose";

import { cookies } from "next/headers";

import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";



const COOKIE = "lk_session";



/** JWT and cookie max age — 90 days. */

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 90;



/** Do not re-issue JWT more often than this (sliding refresh throttle). */

export const SESSION_REFRESH_MIN_INTERVAL_SEC = 60 * 60 * 24;



export type SessionUser = {

  id: string;

  email: string;

  name: string;

  role: UserRole;

  shopId?: string;

  sessionVersion: number;

};



function secret() {

  const s = process.env.JWT_SECRET;

  if (!s) throw new Error("JWT_SECRET is not set");

  return new TextEncoder().encode(s);

}



export async function bumpSessionVersion(userId: string): Promise<number> {

  const user = await prisma.user.update({

    where: { id: userId },

    data: { sessionVersion: { increment: 1 } },

    select: { sessionVersion: true },

  });

  return user.sessionVersion;

}



export async function getSessionVersion(userId: string): Promise<number> {

  const user = await prisma.user.findUnique({

    where: { id: userId },

    select: { sessionVersion: true },

  });

  return user?.sessionVersion ?? 0;

}



export async function createSession(user: SessionUser) {

  const token = await new SignJWT({ ...user })

    .setProtectedHeader({ alg: "HS256" })

    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)

    .sign(secret());



  const jar = await cookies();

  jar.set(COOKIE, token, {

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge: SESSION_MAX_AGE_SEC,

  });

}



/** Re-issue JWT with the same payload (extends cookie and exp). */

export async function refreshSession(user: SessionUser): Promise<void> {

  await createSession(user);

}



export async function readSessionToken(): Promise<{

  session: SessionUser;

  issuedAtSec: number | null;

} | null> {

  const jar = await cookies();

  const token = jar.get(COOKIE)?.value;

  if (!token) return null;

  try {

    const { payload } = await jwtVerify(token, secret());

    const session = payload as SessionUser & { iat?: number };

    if (!session.id) return null;

    return {

      session: {

        id: session.id,

        email: session.email,

        name: session.name,

        role: session.role,

        shopId: session.shopId,

        sessionVersion: session.sessionVersion ?? 0,

      },

      issuedAtSec: typeof session.iat === "number" ? session.iat : null,

    };

  } catch {

    return null;

  }

}



export async function getSession(): Promise<SessionUser | null> {

  const read = await readSessionToken();

  if (!read) return null;



  const { session } = read;

  const user = await prisma.user.findUnique({

    where: { id: session.id },

    select: { sessionVersion: true, role: true },

  });

  if (!user || user.role !== session.role) return null;

  if ((session.sessionVersion ?? 0) !== user.sessionVersion) return null;



  return session;

}



export async function clearSession() {

  const jar = await cookies();

  jar.set(COOKIE, "", {

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge: 0,

  });

}



export async function requireSession(roles?: UserRole[]) {

  const session = await getSession();

  if (!session) return null;

  if (roles && !roles.includes(session.role)) return null;

  return session;

}


