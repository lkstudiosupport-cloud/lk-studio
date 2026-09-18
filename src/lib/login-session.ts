import { cookies } from "next/headers";
import {
  bumpSessionVersion,
  createSession,
  getSessionVersion,
  type SessionUser,
} from "@/lib/auth";
import { APP_SURFACE_COOKIE, parseAppSurface } from "@/lib/app-surface";
import { saveUserLocation, type LocationPayload } from "@/lib/save-location";
import type { UserRole } from "@prisma/client";
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

export function defaultPostAuthPath(role: UserRole, surface: ReturnType<typeof parseAppSurface>) {
  if (surface === "designs") {
    if (role === "SHOP") return "/designs/shop";
    if (role === "CUSTOMER") return "/designs/customer";
  }
  if (role === "SHOP") return "/shop";
  if (role === "ADMIN") return "/admin";
  if (role === "PARTNER") return "/work-partner/requests";
  return "/customer/designs";
}

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

  const jar = await cookies();
  const surface = parseAppSurface(jar.get(APP_SURFACE_COOKIE)?.value);
  return defaultPostAuthPath(role, surface);
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
