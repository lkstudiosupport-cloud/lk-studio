import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  measurementEntries,
  type MeasurementRecord,
  type MeasurementTypeId,
} from "@/lib/measurements";
import { allOrderImagePaths } from "@/lib/order-images";
import { normalizeStoredImageUrl } from "@/lib/storage-url";
import { openExternalUrl } from "@/lib/whatsapp";
import { isCapacitorNative, isMobileWeb } from "@/lib/platform";
import type { ShopOrderData } from "@/components/ShopOrderCard";

function fieldLabelForShare(locale: Locale, type: MeasurementTypeId, key: string): string {
  const typedKey = `measureLabel_${type}_${key}`;
  const typed = t(locale, typedKey);
  return typed !== typedKey ? typed : t(locale, key);
}

function isShareCancelled(err: unknown) {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes("cancel") || msg.includes("abort") || msg.includes("dismiss");
}

export function buildOrderWorkShareText(
  order: ShopOrderData,
  locale: Locale,
  options: {
    subjectName: string;
    shopMeasureType: MeasurementTypeId;
    measurement: MeasurementRecord | null;
  }
): string {
  const lines: string[] = [];
  lines.push(`*${order.orderNumber}*`);
  lines.push(`${t(locale, "orderForPerson")}: ${options.subjectName}`);
  lines.push(`${t(locale, "customer")}: ${order.customer.name}`);
  if (order.customer.phone) {
    lines.push(`${t(locale, "whatsapp")}: ${order.customer.phone}`);
  }

  if (options.measurement) {
    lines.push("");
    lines.push(
      `*${t(locale, `measurementType_${options.shopMeasureType}`)} ${t(locale, "measurements")}*`
    );
    for (const entry of measurementEntries(options.measurement, options.shopMeasureType)) {
      lines.push(`• ${fieldLabelForShare(locale, options.shopMeasureType, entry.key)}: ${entry.value}"`);
    }
  }

  const designTitles = (order.orderFavorites ?? [])
    .map((of) => of.design?.title)
    .filter((title): title is string => Boolean(title));
  if (order.design?.title) designTitles.unshift(order.design.title);
  const uniqueDesigns = [...new Set(designTitles)];
  if (uniqueDesigns.length > 0) {
    lines.push("");
    lines.push(`*${t(locale, "referencePhotos")}*`);
    uniqueDesigns.forEach((title) => lines.push(`• ${title}`));
  }

  const images = allOrderImagePaths(order.images, order.customerRefImages, {
    cloth: order.clothImagePath,
    workDesign: order.workDesignImagePath,
    design: order.design?.imagePath,
  });
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (images.length > 0 && origin) {
    lines.push("");
    lines.push(`*${t(locale, "workPhotos")}*`);
    images.forEach((img, i) => {
      const url = `${origin}${normalizeStoredImageUrl(img.path)}`;
      lines.push(`${i + 1}. ${url}`);
    });
  }

  if (order.notes?.trim()) {
    lines.push("");
    lines.push(`*${t(locale, "notes")}*: ${order.notes.trim()}`);
  }

  lines.push("");
  lines.push(t(locale, "shareOrderWorkFooter"));
  return lines.join("\n");
}

/** Open WhatsApp (or system share) with stitching order details for a worker. */
export async function shareOrderWorkViaWhatsApp(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({
        text,
        title: text.split("\n")[0]?.replace(/\*/g, "") ?? "Order",
      });
      return;
    } catch (err) {
      if (isShareCancelled(err)) return;
    }
  }

  const waMe = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const waScheme = `whatsapp://send?text=${encodeURIComponent(text)}`;

  if (isCapacitorNative() || isMobileWeb()) {
    openExternalUrl(waScheme, waMe);
    return;
  }

  window.open(waMe, "_blank", "noopener,noreferrer");
}
