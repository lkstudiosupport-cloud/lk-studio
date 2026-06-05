import { parsePhone, normalizePhone } from "@/lib/phone";

export function cleanPhoneForWhatsApp(phone: string) {
  const parsed = parsePhone(phone);
  if (parsed) return parsed.e164;

  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function whatsAppUrl(phone: string, text: string) {
  const num = cleanPhoneForWhatsApp(phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(phone: string, text: string) {
  const url = whatsAppUrl(phone, text);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}
