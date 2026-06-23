import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findUserByPhone } from "@/lib/auth-user";
import { isValidPhone, resolvePhoneE164, INVALID_PHONE_MESSAGE } from "@/lib/phone";
import { zodErrorMessage, formString } from "@/lib/zod-error-message";
import { sendLoginOtp } from "@/lib/supabase-otp";

const schema = z.object({
  phone: formString(1),
  role: z.enum(["SHOP", "CUSTOMER"]),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`login-otp-send:${ip}`, 10);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many code requests — try again shortly" },
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

    const { phone, role } = parsed.data;
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: INVALID_PHONE_MESSAGE }, { status: 400 });
    }

    const e164 = resolvePhoneE164(phone);
    if (!e164) {
      return NextResponse.json({ error: INVALID_PHONE_MESSAGE }, { status: 400 });
    }

    const user = await findUserByPhone(role, phone);
    if (!user) {
      return NextResponse.json({ error: "No account found for this mobile number" }, { status: 404 });
    }

    const result = await sendLoginOtp(e164, role);

    return NextResponse.json({
      ok: true,
      expiresAt: result.expiresAt.toISOString(),
      smsDelivered: result.smsDelivered,
      ...(result.demoMode && result.demoCode ? { demoCode: result.demoCode } : {}),
    });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json({ errorKey: "otpSendFailed" }, { status: 500 });
  }
}
