import {
  bumpSessionVersion,
  createSession,
  getSessionVersion,
  type SessionUser,
} from "@/lib/auth";
import { saveUserLocation, type LocationPayload } from "@/lib/save-location";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashOtp, verifyOtp } from "@/lib/auth-user";
import { trustDevice } from "@/lib/trusted-device";

type UserWithShop = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  shopProfile: { id: string } | null;
};

export type FinishLoginOptions = {
  /** Bump sessionVersion (invalidates other devices). Default true. */
  bumpSession?: boolean;
  /** Mark this browser as trusted after OTP or register. */
  trustDevice?: { deviceId: string; userAgent?: string | null };
};

export async function finishLogin(
  user: UserWithShop,
  role: UserRole,
  location?: LocationPayload,
  options?: FinishLoginOptions
) {
  const bump = options?.bumpSession !== false;
  const sessionVersion = bump
    ? await bumpSessionVersion(user.id)
    : await getSessionVersion(user.id);

  if (options?.trustDevice?.deviceId) {
    await trustDevice(user.id, options.trustDevice.deviceId, options.trustDevice.userAgent);
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    shopId: user.shopProfile?.id,
    sessionVersion,
  } satisfies SessionUser);

  await saveUserLocation(user.id, user.role, user.shopProfile?.id, location ?? {});

  return role === "SHOP" ? "/shop" : role === "ADMIN" ? "/admin" : "/customer/designs";
}

export async function finishTrustedPasswordLogin(
  user: UserWithShop,
  role: UserRole,
  deviceId: string,
  location?: LocationPayload,
  userAgent?: string | null
) {
  return finishLogin(user, role, location, {
    bumpSession: false,
    trustDevice: { deviceId, userAgent },
  });
}

export async function storeLoginOtp(phone: string, role: UserRole, code: string) {
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.loginOtp.deleteMany({ where: { phone, role } });
  await prisma.loginOtp.create({
    data: { phone, role, codeHash, expiresAt },
  });

  return expiresAt;
}

export async function consumeLoginOtp(phone: string, role: UserRole, code: string) {
  const row = await prisma.loginOtp.findFirst({
    where: { phone, role },
    orderBy: { createdAt: "desc" },
  });
  if (!row || row.expiresAt < new Date()) return false;

  const ok = await verifyOtp(code, row.codeHash);
  if (!ok) return false;

  await prisma.loginOtp.delete({ where: { id: row.id } });
  return true;
}
