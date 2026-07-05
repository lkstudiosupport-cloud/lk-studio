import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPhoneRegistration } from "@/lib/auth-user";
import { isValidPhone, INVALID_PHONE_MESSAGE } from "@/lib/phone";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { zodErrorMessage, formString } from "@/lib/zod-error-message";

const schema = z.object({
  phone: formString(1),
  role: z.enum(["SHOP", "CUSTOMER"]),
});

/** Check if a mobile number can register for the given role (before sending OTP). */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`check-phone:${ip}`, 40);
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

    const { phone, role } = parsed.data;
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: INVALID_PHONE_MESSAGE }, { status: 400 });
    }

    const conflict = await checkPhoneRegistration(role, phone);
    if (!conflict) {
      return NextResponse.json({ available: true });
    }

    if (conflict.kind === "same_role") {
      return NextResponse.json({
        available: false,
        errorKey: "phoneAlreadyRegistered",
        loginRole: role,
      });
    }

    const errorKey =
      conflict.existingRole === "SHOP" ? "phoneAlreadyShop" : "phoneAlreadyCustomer";
    return NextResponse.json({
      available: false,
      errorKey,
      loginRole: conflict.existingRole,
    });
  } catch (err) {
    console.error("Check phone error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
