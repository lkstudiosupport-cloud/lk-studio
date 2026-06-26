/** Match Firebase ID token phone claim to app E.164 digits. */
export function firebasePhoneMatches(tokenPhone: string, expectedE164: string): boolean {
  const a = tokenPhone.replace(/\D/g, "");
  const b = expectedE164.replace(/\D/g, "");
  if (!a || !b) return false;
  if (a === b) return true;
  return a.slice(-10) === b.slice(-10);
}
