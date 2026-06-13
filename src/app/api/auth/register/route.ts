import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bumpSessionVersion, createSession } from "@/lib/auth";
import { deviceIdSchema, requestUserAgent } from "@/lib/auth-device";
import { trustDevice } from "@/lib/trusted-device";
import { generateShopCode, trialEndDate, SHOP_MONTHLY_PRICE_INR } from "@/lib/subscription";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkPhoneRegistration, phoneFieldsForRegister } from "@/lib/auth-user";
import { isValidPhone, INVALID_PHONE_MESSAGE } from "@/lib/phone";
import { internalEmailForUser } from "@/lib/internal-email";
import { zodErrorMessage, formString, formOptionalString, formOptionalNumber } from "@/lib/zod-error-message";

const schema = z.object({
  password: formString(6),
  name: formString(1),
  phone: formString(1),
  role: z.enum(["SHOP", "CUSTOMER"]),
  deviceId: deviceIdSchema,
  shopName: formOptionalString(),
  latitude: formOptionalNumber(),
  longitude: formOptionalNumber(),
  address: formOptionalString(),
  locationLink: formOptionalString(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`register:${ip}`, 15);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many sign-ups — try again shortly" },
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

    const { password, name, phone, role, deviceId, shopName, latitude, longitude, address, locationLink } =
      parsed.data;
    if (!isValidPhone(phone)) {
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

    const passwordHash = await bcrypt.hash(password, 10);
    const displayShopName = shopName?.trim() || name;
    const phoneFields = phoneFieldsForRegister(phone);
    const email = internalEmailForUser(phoneFields.phoneNormalized, role);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phoneFields.phone,
        phoneNormalized: phoneFields.phoneNormalized,
        whatsapp: phoneFields.whatsapp,
        role,
        ...(role === "CUSTOMER"
          ? {
              subscriptionStatus: "ACTIVE",
              subscriptionEndsAt: null,
              ...(latitude != null && longitude != null
                ? {
                    latitude,
                    longitude,
                    address: address?.trim() || null,
                    locationLink: locationLink?.trim() || null,
                  }
                : {}),
            }
          : {}),
        ...(role === "SHOP"
          ? {
              shopProfile: {
                create: {
                  shopName: displayShopName,
                  shopCode: generateShopCode(displayShopName),
                  phone: phoneFields.phone,
                  whatsapp: phoneFields.whatsapp,
                  subscriptionStatus: "TRIAL",
                  subscriptionEndsAt: trialEndDate(),
                  monthlyPlan: `trial-then-${SHOP_MONTHLY_PRICE_INR}`,
                  ...(latitude != null && longitude != null
                    ? {
                        latitude,
                        longitude,
                        address: address?.trim() || null,
                        locationLink: locationLink?.trim() || null,
                      }
                    : {}),
                },
              },
            }
          : {}),
      },
      include: { shopProfile: true },
    });

    await trustDevice(user.id, deviceId, requestUserAgent(req));

    const sessionVersion = await bumpSessionVersion(user.id);
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      shopId: user.shopProfile?.id,
      sessionVersion,
    });

    const redirectTo = role === "SHOP" ? "/register/autopay" : "/customer";
    return NextResponse.json({ ok: true, redirect: redirectTo });
  } catch (err) {
    console.error("Register error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
