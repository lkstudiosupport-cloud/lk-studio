import { registerPlugin } from "@capacitor/core";
import { buildPhoneInternational, parsePhone } from "@/lib/phone";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone-countries";
import { isCapacitorNative } from "@/lib/platform";

export type PickedContact = {
  name?: string;
  phone?: string;
};

type ContactInfo = {
  name?: string[];
  tel?: string[];
};

type ContactsManager = {
  select: (properties: string[], options?: { multiple?: boolean }) => Promise<ContactInfo[]>;
};

interface ContactPickerPlugin {
  pick: () => Promise<{ name?: string; phone?: string }>;
}

const CapContactPicker = registerPlugin<ContactPickerPlugin>("ContactPicker");

function contactsApi(): ContactsManager | null {
  if (typeof navigator === "undefined") return null;
  const api = (navigator as Navigator & { contacts?: ContactsManager }).contacts;
  return api && typeof api.select === "function" ? api : null;
}

function normalizePickedPhone(raw: string): string {
  const trimmed = raw.trim();
  const parsed = parsePhone(trimmed, DEFAULT_PHONE_COUNTRY);
  if (parsed) {
    return buildPhoneInternational(parsed.national, parsed.country);
  }
  return trimmed;
}

async function pickViaWebApi(): Promise<PickedContact> {
  const api = contactsApi();
  if (!api) {
    throw new Error("CONTACT_PICKER_UNSUPPORTED");
  }

  const picked = await api.select(["name", "tel"], { multiple: false });
  if (!picked?.length) return {};

  const entry = picked[0];
  const name = entry.name?.[0]?.trim();
  const tel = entry.tel?.[0]?.trim();

  return {
    ...(name ? { name } : {}),
    ...(tel ? { phone: normalizePickedPhone(tel) } : {}),
  };
}

async function pickViaCapacitor(): Promise<PickedContact> {
  const result = await CapContactPicker.pick();
  const name = result.name?.trim();
  const tel = result.phone?.trim();

  return {
    ...(name ? { name } : {}),
    ...(tel ? { phone: normalizePickedPhone(tel) } : {}),
  };
}

/** Contact Picker API (Chrome Android) or Capacitor native picker on APK. */
export function isContactPickerSupported(): boolean {
  if (contactsApi() !== null) return true;
  return isCapacitorNative();
}

/**
 * Best-effort phone contact pick — Web Contact Picker API or Capacitor ACTION_PICK on APK.
 * WhatsApp does not expose chat/contact selection to web apps — use device contacts or manual entry.
 */
export async function pickPhoneContact(): Promise<PickedContact> {
  if (contactsApi()) {
    return pickViaWebApi();
  }

  if (isCapacitorNative()) {
    try {
      return await pickViaCapacitor();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "CANCELLED" || msg === "NO_CONTACT") return {};
      throw err;
    }
  }

  throw new Error("CONTACT_PICKER_UNSUPPORTED");
}
