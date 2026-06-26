import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findUserByPhone } from "@/lib/auth-user";
import { finishLogin } from "@/lib/login-session";
import { isValidPhone, INVALID_PHONE_MESSAGE } from "@/lib/phone";
import { zodErrorMessage, formString, formOptionalString, formOptionalNumber } from "@/lib/zod-error-message";
import { deviceIdSchema, requestUserAgent } from "@/lib/auth-device";

const schema = z.object({
  phone: formString(1),
  password: formString(1),
  role: z.enum(["SHOP", "CUSTOMER", "ADMIN"]),
  deviceId: deviceIdSchema,
  latitude: formOptionalNumber(),
  longitude: formOptionalNumber(),
  address: formOptionalString(),
  locationLink: formOptionalString(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`login:${ip}`, 30);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts — try again shortly" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }

    const { phone, password, role, deviceId, latitude, longitude, address, locationLink } =
      parsed.data;
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: INVALID_PHONE_MESSAGE }, { status: 400 });
    }

    const user = await findUserByPhone(role, phone);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const redirect = await finishLogin(
      user,
      role,
      { latitude, longitude, address, locationLink },
      {
        bumpSession: true,
        trustDevice: { deviceId, userAgent: requestUserAgent(req) },
      }
    );
    return NextResponse.json({ ok: true, redirect });
  } catch (err) {
    console.error("Login error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
