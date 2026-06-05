import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { normalizePhone, phoneLookupKeys, parsePhone } from "@/lib/phone";

export async function findUserByPhone(role: UserRole, rawPhone: string) {
  const keys = phoneLookupKeys(rawPhone);
  if (keys.length === 0) return null;

  const byNormalized = await prisma.user.findFirst({
    where: { role, phoneNormalized: { in: keys } },
    include: { shopProfile: true },
  });
  if (byNormalized) return byNormalized;

  // Legacy rows without phoneNormalized — match stored phone/whatsapp text
  const candidates = await prisma.user.findMany({
    where: { role, phoneNormalized: null },
    include: { shopProfile: true },
  });

  return (
    candidates.find((u) => {
      const p = u.phone ? normalizePhone(u.phone) : "";
      const w = u.whatsapp ? normalizePhone(u.whatsapp) : "";
      return keys.some((k) => k === p || k === w);
    }) ?? null
  );
}

export async function findUserByPhoneAnyRole(rawPhone: string) {
  const keys = phoneLookupKeys(rawPhone);
  if (keys.length === 0) return null;

  const byNormalized = await prisma.user.findFirst({
    where: { phoneNormalized: { in: keys } },
    select: { id: true, role: true },
  });
  if (byNormalized) return byNormalized;

  const candidates = await prisma.user.findMany({
    where: { phoneNormalized: null },
    select: { id: true, role: true, phone: true, whatsapp: true },
  });

  return (
    candidates.find((u) => {
      const p = u.phone ? normalizePhone(u.phone) : "";
      const w = u.whatsapp ? normalizePhone(u.whatsapp) : "";
      return keys.some((k) => k === p || k === w);
    }) ?? null
  );
}

export type PhoneRegistrationConflict =
  | { kind: "same_role" }
  | { kind: "other_role"; existingRole: UserRole };

export async function checkPhoneRegistration(
  role: UserRole,
  rawPhone: string
): Promise<PhoneRegistrationConflict | null> {
  const existing = await findUserByPhoneAnyRole(rawPhone);
  if (!existing) return null;
  if (existing.role === role) return { kind: "same_role" };
  return { kind: "other_role", existingRole: existing.role };
}

export async function phoneTaken(role: UserRole, rawPhone: string, excludeUserId?: string) {
  const user = await findUserByPhone(role, rawPhone);
  if (!user) return false;
  if (excludeUserId && user.id === excludeUserId) return false;
  return true;
}

export function phoneFieldsForRegister(rawPhone: string) {
  const parsed = parsePhone(rawPhone);
  if (parsed) {
    return {
      phone: parsed.display,
      phoneNormalized: parsed.e164,
      whatsapp: parsed.e164,
    };
  }
  const trimmed = rawPhone.trim();
  return {
    phone: trimmed,
    phoneNormalized: normalizePhone(trimmed),
    whatsapp: trimmed.replace(/\s/g, ""),
  };
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(code: string) {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}
