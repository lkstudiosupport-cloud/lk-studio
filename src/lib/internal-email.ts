import type { UserRole } from "@prisma/client";

const DOMAIN = "users.lkstudio.app";

/** Internal-only email for DB / Razorpay — never shown to shop or customer. */
export function internalEmailForUser(phoneNormalized: string, role: UserRole): string {
  const digits = phoneNormalized.replace(/\D/g, "");
  return `${role.toLowerCase()}.${digits}@${DOMAIN}`;
}

export function isInternalEmail(email: string): boolean {
  return email.endsWith(`@${DOMAIN}`);
}

/** Razorpay needs an email; use stored internal address. */
export function emailForPayments(storedEmail: string): string {
  return storedEmail;
}
