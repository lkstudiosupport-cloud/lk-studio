import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export function hashDeviceId(deviceId: string): string {
  const pepper = process.env.JWT_SECRET ?? "lk-dev-device";
  return createHash("sha256").update(`${pepper}:${deviceId}`).digest("hex");
}

export async function isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
  const deviceHash = hashDeviceId(deviceId);
  const row = await prisma.trustedDevice.findUnique({
    where: { userId_deviceHash: { userId, deviceHash } },
    select: { id: true },
  });
  return !!row;
}

export async function trustDevice(
  userId: string,
  deviceId: string,
  userAgent?: string | null
): Promise<void> {
  const deviceHash = hashDeviceId(deviceId);
  const snippet = userAgent?.trim().slice(0, 200) || null;

  await prisma.trustedDevice.upsert({
    where: { userId_deviceHash: { userId, deviceHash } },
    create: { userId, deviceHash, userAgent: snippet },
    update: { lastUsedAt: new Date(), userAgent: snippet ?? undefined },
  });
}

export async function untrustDevice(userId: string, deviceId: string): Promise<void> {
  const deviceHash = hashDeviceId(deviceId);
  await prisma.trustedDevice.deleteMany({
    where: { userId, deviceHash },
  });
}

export async function touchTrustedDevice(userId: string, deviceId: string): Promise<void> {
  const deviceHash = hashDeviceId(deviceId);
  await prisma.trustedDevice.updateMany({
    where: { userId, deviceHash },
    data: { lastUsedAt: new Date() },
  });
}
