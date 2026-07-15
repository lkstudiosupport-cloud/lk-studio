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
import type { ShopOrderData } from "@/lib/shop-order-types";

function fieldLabelForShare(locale: Locale, type: MeasurementTypeId, key: string): string {
  const typedKey = `measureLabel_${type}_${key}`;
  const typed = t(locale, typedKey);
  return typed !== typedKey ? typed : t(locale, key);
}

function orderImageUrls(order: ShopOrderData): string[] {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!origin) return [];
  return allOrderImagePaths(order.images, order.customerRefImages, {
    cloth: order.clothImagePath,
    workDesign: order.workDesignImagePath,
    design: order.design?.imagePath,
  }).map((img) => `${origin}${normalizeStoredImageUrl(img.path)}`);
}

/** WhatsApp text — order details, measurements, and numbered work photo URLs. */
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

  if (options.measurement) {
    lines.push("");
    lines.push(
      `*${t(locale, `measurementType_${options.shopMeasureType}`)} ${t(locale, "measurements")}*`
    );
    for (const entry of measurementEntries(options.measurement, options.shopMeasureType)) {
      lines.push(`• ${fieldLabelForShare(locale, options.shopMeasureType, entry.key)}: ${entry.value}"`);
    }
  }

  if (order.notes?.trim()) {
    lines.push("");
    lines.push(`*${t(locale, "notes")}*: ${order.notes.trim()}`);
  }

  const imageUrls = orderImageUrls(order);
  if (imageUrls.length > 0) {
    lines.push("");
    lines.push(`*${t(locale, "workPhotos")}*`);
    imageUrls.forEach((url, i) => lines.push(`${i + 1}. ${url}`));
  }

  lines.push("");
  lines.push(t(locale, "shareOrderWorkFooter"));
  return lines.join("\n");
}

/** Open WhatsApp with pre-filled order text (measurements + photo links). */
export function shareOrderWorkViaWhatsApp({
  order,
  locale,
  subjectName,
  shopMeasureType,
  measurement,
}: {
  order: ShopOrderData;
  locale: Locale;
  subjectName: string;
  shopMeasureType: MeasurementTypeId;
  measurement: MeasurementRecord | null;
}): void {
  const text = buildOrderWorkShareText(order, locale, { subjectName, shopMeasureType, measurement });
  const waMe = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const waScheme = `whatsapp://send?text=${encodeURIComponent(text)}`;

  if (isCapacitorNative() || isMobileWeb()) {
    openExternalUrl(waScheme, waMe);
    return;
  }

  window.open(waMe, "_blank", "noopener,noreferrer");
}
