/** Seeded demo mobiles — safe to skip OTP for showroom / APK demos. */
export const DEMO_SHOP_PHONE = "9876543210";
export const DEMO_SHOP2_PHONE = "9988776655";
export const DEMO_CUSTOMER_PHONE = "9123456789";
export const DEMO_PASSWORD = "demo123";

const DEMO_PHONES = new Set([
  DEMO_SHOP_PHONE,
  DEMO_SHOP2_PHONE,
  DEMO_CUSTOMER_PHONE,
]);

export function demoPhoneKey(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return DEMO_PHONES.has(last10) ? last10 : null;
}

export function isDemoPhone(rawPhone: string): boolean {
  return demoPhoneKey(rawPhone) != null;
}

export function isDemoPhoneE164(e164Digits: string): boolean {
  return isDemoPhone(e164Digits);
}

/** Match demo account from stored user fields (phone or phoneNormalized). */
export function isDemoAccountUser(
  user: { phone?: string | null; phoneNormalized?: string | null } | null | undefined
): boolean {
  if (!user) return false;
  if (user.phoneNormalized && DEMO_PHONES.has(user.phoneNormalized)) return true;
  if (user.phone && isDemoPhone(user.phone)) return true;
  return false;
}
