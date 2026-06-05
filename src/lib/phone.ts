import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone-countries";

export type ParsedPhone = {
  /** Digits only, e.g. 919876543210 */
  e164: string;
  /** International display, e.g. +91 98765 43210 */
  display: string;
  country: CountryCode;
  national: string;
};

export const INVALID_PHONE_MESSAGE = "Enter a valid mobile number with country code";

function isMobileType(type: string | undefined): boolean {
  return !type || type === "MOBILE" || type === "FIXED_LINE_OR_MOBILE";
}

function toParsed(parsed: NonNullable<ReturnType<typeof parsePhoneNumberFromString>>): ParsedPhone {
  return {
    e164: parsed.number.replace(/\D/g, ""),
    display: parsed.formatInternational(),
    country: parsed.country ?? DEFAULT_PHONE_COUNTRY,
    national: parsed.nationalNumber,
  };
}

/** Parse and validate; returns null if invalid. */
export function parsePhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): ParsedPhone | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed?.isValid() || !isMobileType(parsed.getType() ?? undefined)) return null;

  return toParsed(parsed);
}

/** E.164 digits (no +). Backward-compatible name used across auth. */
export function normalizePhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): string {
  const parsed = parsePhone(input, defaultCountry);
  if (parsed) return parsed.e164;

  const digits = input.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function isValidPhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (parsePhone(trimmed, defaultCountry)) return true;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10 && defaultCountry === "IN") {
    return isValidPhoneNumber(digits, "IN");
  }

  return isValidPhoneNumber(trimmed, defaultCountry);
}

export function formatPhoneDisplay(input: string): string {
  const parsed = parsePhone(input);
  if (parsed) return parsed.display;

  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return input;
}

/** International format with + prefix for forms/API. */
export function buildPhoneInternational(
  nationalDigits: string,
  country: CountryCode = DEFAULT_PHONE_COUNTRY
): string {
  const national = nationalDigits.replace(/\D/g, "");
  if (!national) return "";
  return `+${getCountryCallingCode(country)}${national}`;
}

/** @deprecated Use buildPhoneInternational — kept for internal use */
export function buildPhoneE164(
  nationalDigits: string,
  country: CountryCode = DEFAULT_PHONE_COUNTRY
): string {
  return buildPhoneInternational(nationalDigits, country);
}

export function dialCodeFor(country: CountryCode): string {
  return `+${getCountryCallingCode(country)}`;
}

/** Lookup keys for DB — E.164 plus legacy 10-digit India fallback. */
export function phoneLookupKeys(rawPhone: string): string[] {
  const parsed = parsePhone(rawPhone);
  const keys = new Set<string>();
  if (parsed) {
    keys.add(parsed.e164);
    if (parsed.country === "IN") keys.add(parsed.national);
  } else {
    const legacy = normalizePhone(rawPhone);
    if (legacy) keys.add(legacy);
  }
  return [...keys];
}

/** Resolve to canonical E.164 digits for OTP storage and sessions. */
export function resolvePhoneE164(
  rawPhone: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): string | null {
  const parsed = parsePhone(rawPhone, defaultCountry);
  if (parsed) return parsed.e164;

  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10 && isValidPhoneNumber(digits, "IN")) {
    return `${getCountryCallingCode("IN")}${digits}`;
  }

  return null;
}
