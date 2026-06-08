import { parsePhone } from "@/lib/phone";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone-countries";

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

function contactsApi(): ContactsManager | null {
  if (typeof navigator === "undefined") return null;
  const api = (navigator as Navigator & { contacts?: ContactsManager }).contacts;
  return api && typeof api.select === "function" ? api : null;
}

/** Contact Picker API (Chrome Android) — cannot read WhatsApp chats, only device contacts. */
export function isContactPickerSupported(): boolean {
  return contactsApi() !== null;
}

function normalizePickedPhone(raw: string): string {
  const trimmed = raw.trim();
  const parsed = parsePhone(trimmed, DEFAULT_PHONE_COUNTRY);
  return parsed?.display ?? trimmed;
}

/**
 * Best-effort phone contact pick via Contact Picker API.
 * WhatsApp does not expose chat/contact selection to web apps — use device contacts or manual entry.
 */
export async function pickPhoneContact(): Promise<PickedContact> {
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
