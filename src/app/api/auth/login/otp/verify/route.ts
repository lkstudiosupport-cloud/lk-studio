import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findUserByPhone } from "@/lib/auth-user";
import { finishLogin } from "@/lib/login-session";
import { isValidPhone, resolvePhoneE164, INVALID_PHONE_MESSAGE } from "@/lib/phone";
import {
  zodErrorMessage,
  formString,
  formCode,
  formOptionalString,
  formOptionalNumber,
} from "@/lib/zod-error-message";
import { deviceIdSchema, requestUserAgent } from "@/lib/auth-device";
import { verifyLoginOtp, verifyMsg91WidgetLogin } from "@/lib/login-otp";

const schema = z
  .object({
    phone: formString(1),
    code: formCode().optional(),
    accessToken: formString(20).optional(),
    role: z.enum(["SHOP", "CUSTOMER"]),
    deviceId: deviceIdSchema,
    latitude: formOptionalNumber(),
    longitude: formOptionalNumber(),
    address: formOptionalString(),
    locationLink: formOptionalString(),
  })
  .refine((d) => Boolean(d.code?.trim() || d.accessToken?.trim()), {
    message: "OTP code or MSG91 access token required",
    path: ["code"],
  });

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`login-otp-verify:${ip}`, 20);
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

    const {
      phone,
      code,
      accessToken,
      role,
      deviceId,
      latitude,
      longitude,
      address,
      locationLink,
    } = parsed.data;
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: INVALID_PHONE_MESSAGE }, { status: 400 });
    }

    const e164 = resolvePhoneE164(phone);
    if (!e164) {
      return NextResponse.json({ error: INVALID_PHONE_MESSAGE }, { status: 400 });
    }

    const ok = accessToken
      ? await verifyMsg91WidgetLogin(e164, accessToken)
      : await verifyLoginOtp(e164, role, code!.trim());

    if (!ok) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    const user = await findUserByPhone(role, phone);
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const redirect = await finishLogin(
      user,
      role,
      {
        latitude,
        longitude,
        address,
        locationLink,
      },
      {
        bumpSession: true,
        trustDevice: { deviceId, userAgent: requestUserAgent(req) },
      }
    );

    return NextResponse.json({ ok: true, redirect });
  } catch (err) {
    console.error("OTP verify error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
