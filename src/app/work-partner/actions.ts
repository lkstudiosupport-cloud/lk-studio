"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { phoneFieldsForRegister } from "@/lib/auth-user";
import { normalizeCity } from "@/lib/cities";

export type AcceptWorkerPartnerResult =
  | { ok: true }
  | { ok: false; error: string };

export async function acceptWorkerPartnerRequest(
  formData: FormData
): Promise<AcceptWorkerPartnerResult> {
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) return { ok: false, error: "Missing request" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Enter your name" };

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phoneFields = phoneFieldsForRegister(phoneRaw);
  if (!phoneFields.phoneNormalized || phoneFields.phoneNormalized.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Enter a valid mobile number" };
  }

  const city = normalizeCity(String(formData.get("city") ?? "").trim()) || null;
  if (!city) return { ok: false, error: "Select your city" };

  const yearsRaw = Number(formData.get("yearsExperience"));
  const yearsExperience =
    Number.isFinite(yearsRaw) && yearsRaw >= 0 && yearsRaw <= 60
      ? Math.floor(yearsRaw)
      : 0;

  const address = String(formData.get("address") ?? "").trim() || null;
  const locationLink = String(formData.get("locationLink") ?? "").trim() || null;

  const open = await prisma.workerPartnerRequest.findFirst({
    where: { id: requestId, status: "OPEN" },
    select: { id: true, shopId: true },
  });
  if (!open) {
    return { ok: false, error: "This request is no longer open" };
  }

  const partner = await prisma.workPartnerProfile.upsert({
    where: { phoneNormalized: phoneFields.phoneNormalized },
    create: {
      name,
      phone: phoneFields.phone ?? phoneRaw,
      phoneNormalized: phoneFields.phoneNormalized,
      city,
      address,
      locationLink,
      yearsExperience,
    },
    update: {
      name,
      phone: phoneFields.phone ?? phoneRaw,
      city,
      address,
      locationLink,
      yearsExperience,
    },
    select: { id: true },
  });

  const updated = await prisma.workerPartnerRequest.updateMany({
    where: { id: requestId, status: "OPEN" },
    data: {
      status: "FILLED",
      acceptedPartnerId: partner.id,
      acceptedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return { ok: false, error: "This request was already filled" };
  }

  revalidatePath("/work-partner/requests");
  revalidatePath("/shop/workers");
  return { ok: true };
}
