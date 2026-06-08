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

function isExternalAppUrl(url: string) {
  return /^(whatsapp|intent|tel|mailto):/i.test(url);
}

function clickExternalLink(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Open a URL in an external app (WhatsApp, Android intent). Avoids navigating the WebView away on native. */
export function openExternalUrl(primary: string, fallback?: string) {
  if (typeof window === "undefined") return;

  const anchorOnly = isCapacitorNative() || isExternalAppUrl(primary);
  clickExternalLink(primary);

  if (!anchorOnly) {
    window.setTimeout(() => {
      window.location.href = primary;
    }, 350);
  }

  if (fallback && fallback !== primary) {
    window.setTimeout(() => {
      clickExternalLink(fallback);
      if (!anchorOnly && !isExternalAppUrl(fallback)) {
        window.location.href = fallback;
      }
    }, 900);
  }
}

/** Open a deep link — anchor click plus delayed navigation (mobile browsers). */
export function openDeepLink(primary: string, fallback?: string) {
  openExternalUrl(primary, fallback);
}

export function openWhatsApp(phone: string, text: string) {
  const waMe = whatsAppUrl(phone, text);
  if (!waMe) return;

  const waScheme = whatsAppDeepLink(phone, text);

  if ((isCapacitorNative() || isMobileWeb()) && waScheme) {
    openExternalUrl(waScheme, waMe);
    return;
  }

  window.open(waMe, "_blank", "noopener,noreferrer");
}
