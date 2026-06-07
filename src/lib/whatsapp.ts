import { parsePhone } from "@/lib/phone";
import { isCapacitorNative, isMobileWeb } from "@/lib/platform";

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

export function whatsAppDeepLink(phone: string, text: string) {
  const num = cleanPhoneForWhatsApp(phone);
  if (!num) return null;
  return `whatsapp://send?phone=${num}&text=${encodeURIComponent(text)}`;
}

/** Open a deep link — anchor click plus delayed navigation (Capacitor WebView + mobile browsers). */
export function openDeepLink(primary: string, fallback?: string) {
  if (typeof window === "undefined") return;

  const a = document.createElement("a");
  a.href = primary;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => {
    window.location.href = primary;
  }, 350);

  if (fallback && fallback !== primary) {
    window.setTimeout(() => {
      window.location.href = fallback;
    }, 900);
  }
}

export function openWhatsApp(phone: string, text: string) {
  const waMe = whatsAppUrl(phone, text);
  if (!waMe) return;

  const waScheme = whatsAppDeepLink(phone, text);

  if ((isCapacitorNative() || isMobileWeb()) && waScheme) {
    openDeepLink(waScheme, waMe);
    return;
  }

  window.open(waMe, "_blank", "noopener,noreferrer");
}
