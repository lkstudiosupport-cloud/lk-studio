import { z } from "zod";

export const deviceIdSchema = z
  .string()
  .trim()
  .min(16, "Device id required")
  .max(128);

export function parseDeviceId(body: Record<string, unknown>): string | null {
  const parsed = deviceIdSchema.safeParse(body.deviceId);
  return parsed.success ? parsed.data : null;
}

export function requestUserAgent(req: Request): string | null {
  return req.headers.get("user-agent");
}
