import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LocationPayload = {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  locationLink?: string | null;
};

export async function saveUserLocation(
  userId: string,
  role: UserRole,
  shopId: string | undefined,
  location: LocationPayload
) {
  const lat = location.latitude ?? null;
  const lng = location.longitude ?? null;
  if (lat == null || lng == null) return;

  if (role === "CUSTOMER") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        latitude: lat,
        longitude: lng,
        ...(location.address?.trim() ? { address: location.address.trim() } : {}),
        ...(location.locationLink?.trim() ? { locationLink: location.locationLink.trim() } : {}),
      },
    });
    return;
  }

  if (role === "SHOP" && shopId) {
    await prisma.shopProfile.update({
      where: { id: shopId },
      data: {
        latitude: lat,
        longitude: lng,
        ...(location.address?.trim() ? { address: location.address.trim() } : {}),
        ...(location.locationLink?.trim() ? { locationLink: location.locationLink.trim() } : {}),
      },
    });
  }
}
