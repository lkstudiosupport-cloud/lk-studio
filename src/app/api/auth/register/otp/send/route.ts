import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkPhoneRegistration } from "@/lib/auth-user";
import { isValidPhone, resolvePhoneE164, INVALID_PHONE_MESSAGE } from "@/lib/phone";
import { zodErrorMessage, formString } from "@/lib/zod-error-message";
import { sendLoginOtp } from "@/lib/login-otp";

const schema = z.object({
  phone: formString(1),
  role: z.enum(["SHOP", "CUSTOMER"]),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`register-otp-send:${ip}`, 10);
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

    const phoneConflict = await checkPhoneRegistration(role, phone);
    if (phoneConflict?.kind === "same_role") {
      return NextResponse.json({ errorKey: "phoneAlreadyRegistered" }, { status: 409 });
    }
    if (phoneConflict?.kind === "other_role") {
      const errorKey =
        phoneConflict.existingRole === "SHOP" ? "phoneAlreadyShop" : "phoneAlreadyCustomer";
      return NextResponse.json({ errorKey }, { status: 409 });
    }

    const result = await sendLoginOtp(e164, role);

    return NextResponse.json({
      ok: true,
      expiresAt: result.expiresAt.toISOString(),
      smsDelivered: result.smsDelivered,
      ...(result.demoMode && result.demoCode ? { demoCode: result.demoCode } : {}),
    });
  } catch (err) {
    console.error("Register OTP send error:", err);
    const detail = err instanceof Error ? err.message.slice(0, 200) : undefined;
    return NextResponse.json(
      { errorKey: "otpSendFailed", ...(detail ? { detail } : {}) },
      { status: 500 }
    );
  }
}
