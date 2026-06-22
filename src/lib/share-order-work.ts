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
import { isCapacitorNative, isMobileWeb, withTimeout } from "@/lib/platform";
import { loadHtml2Canvas, preloadBillCaptureLib } from "@/lib/bill-receipt-capture";
import type { ShopOrderData } from "@/lib/shop-order-types";

const CAPTURE_WIDTH_PX = 400;
const JPEG_QUALITY = 0.9;
const CAPTURE_TIMEOUT_MS = 15000;

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

/** Text caption for share — no raw image URLs (photos sent as files / in summary image). */
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

  if (order.notes?.trim()) {
    lines.push("");
    lines.push(`*${t(locale, "notes")}*: ${order.notes.trim()}`);
  }

  const imageCount = allOrderImagePaths(order.images, order.customerRefImages, {
    cloth: order.clothImagePath,
    workDesign: order.workDesignImagePath,
    design: order.design?.imagePath,
  }).length;
  if (imageCount > 0) {
    lines.push("");
    lines.push(`📷 ${t(locale, "workPhotos")} (${imageCount})`);
  }

  lines.push("");
  lines.push(t(locale, "shareOrderWorkFooter"));
  return lines.join("\n");
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

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return;
  await Promise.race([
    Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    ),
    new Promise<void>((resolve) => window.setTimeout(resolve, 4000)),
  ]);
}

async function captureShareSheet(elementId: string): Promise<Blob> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Share sheet not ready");

  await waitForImages(el);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const html2canvas = await loadHtml2Canvas();
  const canvas = await withTimeout(
    html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      width: CAPTURE_WIDTH_PX,
      windowWidth: CAPTURE_WIDTH_PX,
    }),
    CAPTURE_TIMEOUT_MS,
    "Order capture timed out"
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not create share image"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

async function urlToFile(url: string, index: number): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = url.toLowerCase().includes(".png") ? "png" : "jpg";
    const type = blob.type || (ext === "png" ? "image/png" : "image/jpeg");
    return new File([blob], `work-photo-${index + 1}.${ext}`, { type });
  } catch {
    return null;
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read image"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

async function tryCapacitorShareFiles(
  files: File[],
  title: string,
  text: string
): Promise<"shared" | "cancelled" | "failed"> {
  if (!isCapacitorNative() || files.length === 0) return "failed";
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const uris: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const base64 = await blobToBase64(file);
      const path = `order-share-${Date.now()}-${i}.${file.name.split(".").pop() ?? "jpg"}`;
      await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache });
      const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path });
      uris.push(uri);
    }
    try {
      await Share.share({ title, text, files: uris, dialogTitle: title });
    } catch (shareErr) {
      if (isShareCancelled(shareErr)) return "cancelled";
      return "shared";
    }
    return "shared";
  } catch {
    return "failed";
  }
}

async function tryWebShareText(
  text: string,
  title: string
): Promise<"shared" | "cancelled" | "failed"> {
  if (typeof navigator === "undefined" || !("share" in navigator)) return "failed";
  try {
    await navigator.share({ text, title });
    return "shared";
  } catch (err) {
    if (isShareCancelled(err)) return "cancelled";
    return "failed";
  }
}

async function tryWebShareFiles(
  files: File[],
  title: string,
  text: string
): Promise<"shared" | "cancelled" | "unavailable" | "failed"> {
  if (typeof navigator === "undefined" || !("share" in navigator)) return "unavailable";

  const attempts: File[][] = [files, files.slice(0, 1)];
  for (const batch of attempts) {
    if (batch.length === 0) continue;
    const payload = { files: batch, title, text };
    try {
      if (navigator.canShare && !navigator.canShare(payload)) continue;
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      if (isShareCancelled(err)) return "cancelled";
    }
  }
  return "failed";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Share order as visual image + work photos with caption (WhatsApp / system share). */
export async function shareOrderWork({
  order,
  locale,
  subjectName,
  shopMeasureType,
  measurement,
  captureElementId,
}: {
  order: ShopOrderData;
  locale: Locale;
  subjectName: string;
  shopMeasureType: MeasurementTypeId;
  measurement: MeasurementRecord | null;
  captureElementId: string;
}): Promise<void> {
  preloadBillCaptureLib();
  const text = buildOrderWorkShareText(order, locale, { subjectName, shopMeasureType, measurement });
  const title = order.orderNumber;

  const summaryBlob = await captureShareSheet(captureElementId);
  const summaryFile = new File([summaryBlob], `${order.orderNumber}-order.jpg`, {
    type: "image/jpeg",
  });

  const photoFiles = (
    await Promise.all(orderImageUrls(order).map((url, i) => urlToFile(url, i)))
  ).filter((f): f is File => f != null);

  const files = [summaryFile, ...photoFiles];

  if (isCapacitorNative()) {
    const result = await tryCapacitorShareFiles(files, title, text);
    if (result === "shared" || result === "cancelled") return;
    downloadBlob(summaryBlob, summaryFile.name);
    return;
  }

  if (typeof navigator !== "undefined" && "share" in navigator) {
    const webResult = await tryWebShareFiles(files, title, text);
    if (webResult === "shared" || webResult === "cancelled") return;
    const textOnly = await tryWebShareText(text, title);
    if (textOnly === "shared" || textOnly === "cancelled") return;
  }

  downloadBlob(summaryBlob, summaryFile.name);

  const waMe = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const waScheme = `whatsapp://send?text=${encodeURIComponent(text)}`;
  if (isCapacitorNative() || isMobileWeb()) {
    openExternalUrl(waScheme, waMe);
    return;
  }
  window.open(waMe, "_blank", "noopener,noreferrer");
}
