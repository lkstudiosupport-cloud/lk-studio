import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  measurementEntries,
  type MeasurementRecord,
  type MeasurementTypeId,
} from "@/lib/measurements";
import { allOrderImagePaths } from "@/lib/order-images";
import { ORDER_WORK_SHARE_STYLES } from "@/lib/order-work-share-styles";
import { openExternalUrl } from "@/lib/whatsapp";
import { isCapacitorNative, isMobileWeb, withTimeout } from "@/lib/platform";
import { loadHtml2Canvas, preloadBillCaptureLib } from "@/lib/bill-receipt-capture";
import type { ShopOrderData } from "@/lib/shop-order-types";

const CAPTURE_WIDTH_PX = 400;
const JPEG_QUALITY = 0.9;
const CAPTURE_READY_MAX_MS = 3000;
const CAPTURE_CANVAS_TIMEOUT_MS = 12000;
const CAPTURE_TOTAL_TIMEOUT_MS = 15000;

function fieldLabelForShare(locale: Locale, type: MeasurementTypeId, key: string): string {
  const typedKey = `measureLabel_${type}_${key}`;
  const typed = t(locale, typedKey);
  return typed !== typedKey ? typed : t(locale, key);
}

function isShareCancelled(err: unknown) {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("cancel") ||
    msg.includes("canceled") ||
    msg.includes("abort") ||
    msg.includes("dismiss") ||
    msg.includes("closed")
  );
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Text caption for share — photos are embedded in the summary image. */
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

async function waitForShareSheetReady(elementId: string): Promise<HTMLElement> {
  const deadline = Date.now() + CAPTURE_READY_MAX_MS;

  while (Date.now() < deadline) {
    const el = document.getElementById(elementId);
    if (el instanceof HTMLElement) {
      await waitForImages(el);
      await nextPaint();
      return el;
    }
    await nextPaint();
  }

  const el = document.getElementById(elementId);
  if (el instanceof HTMLElement) return el;
  throw new Error("Share sheet not ready");
}

async function captureShareCanvas(el: HTMLElement) {
  await waitForImages(el);
  const html2canvas = await loadHtml2Canvas();
  return withTimeout(
    html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      width: CAPTURE_WIDTH_PX,
      windowWidth: CAPTURE_WIDTH_PX,
      height: el.scrollHeight,
      windowHeight: el.scrollHeight,
    }),
    CAPTURE_CANVAS_TIMEOUT_MS,
    "Order capture timed out"
  );
}

async function captureInIsolatedIframe(originalRoot: HTMLElement) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${CAPTURE_WIDTH_PX}px`;
  iframe.style.height = "2000px";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Could not prepare order capture");

    doc.open();
    doc.write("<!DOCTYPE html><html><head></head><body></body></html>");
    doc.close();

    const safeStyle = doc.createElement("style");
    safeStyle.textContent = `
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        font-family: "Poppins", "Segoe UI", system-ui, sans-serif;
      }
      ${ORDER_WORK_SHARE_STYLES}
    `;
    doc.head.appendChild(safeStyle);

    const clone = originalRoot.cloneNode(true) as HTMLElement;
    clone.style.position = "static";
    clone.style.opacity = "1";
    clone.style.pointerEvents = "none";
    clone.style.width = `${CAPTURE_WIDTH_PX}px`;
    clone.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;
    doc.body.appendChild(clone);

    const images = Array.from(clone.querySelectorAll("img"));
    await Promise.race([
      Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.src) img.src = img.src;
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

    const html2canvas = await loadHtml2Canvas();
    return await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      width: CAPTURE_WIDTH_PX,
      windowWidth: CAPTURE_WIDTH_PX,
      height: clone.scrollHeight,
      windowHeight: clone.scrollHeight,
    });
  } finally {
    iframe.remove();
  }
}

async function captureShareSheet(elementId: string): Promise<Blob> {
  const el = await waitForShareSheetReady(elementId);

  let canvas;
  try {
    canvas = await captureShareCanvas(el);
  } catch {
    canvas = await captureInIsolatedIframe(el);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not create share image"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
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

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function tryCapacitorShareFile(
  file: File,
  title: string,
  text: string
): Promise<"shared" | "cancelled" | "failed"> {
  if (!isCapacitorNative()) return "failed";
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const base64 = await blobToBase64(file);
    const path = safeFileName(`order-share-${Date.now()}.jpg`);
    await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path });
    try {
      await Share.share({ title, text, files: [uri], dialogTitle: title });
    } catch (shareErr) {
      if (isShareCancelled(shareErr)) return "cancelled";
      return "shared";
    }
    return "shared";
  } catch {
    return "failed";
  }
}

async function tryWebShareFile(
  file: File,
  title: string,
  text: string
): Promise<"shared" | "cancelled" | "unavailable" | "failed"> {
  if (typeof navigator === "undefined" || !("share" in navigator)) return "unavailable";
  try {
    const payload = { files: [file], title, text };
    if (navigator.canShare && !navigator.canShare(payload)) return "unavailable";
    await navigator.share(payload);
    return "shared";
  } catch (err) {
    if (isShareCancelled(err)) return "cancelled";
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

/** Share order as a visual summary image with caption (WhatsApp / system share). */
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
  const fileName = safeFileName(`${order.orderNumber}-order.jpg`);

  const blob = await withTimeout(
    captureShareSheet(captureElementId),
    CAPTURE_TOTAL_TIMEOUT_MS,
    "Order image capture timed out"
  );
  const file = new File([blob], fileName, { type: "image/jpeg" });

  if (isCapacitorNative()) {
    const nativeResult = await tryCapacitorShareFile(file, title, text);
    if (nativeResult === "shared" || nativeResult === "cancelled") return;
    downloadBlob(blob, fileName);
    return;
  }

  if (isMobileWeb() && typeof navigator !== "undefined" && "share" in navigator) {
    const shareResult = await tryWebShareFile(file, title, text);
    if (shareResult === "shared" || shareResult === "cancelled") return;
  }

  if (typeof navigator !== "undefined" && "share" in navigator) {
    const desktopShare = await tryWebShareFile(file, title, text);
    if (desktopShare === "shared" || desktopShare === "cancelled") return;
    const textOnly = await tryWebShareText(text, title);
    if (textOnly === "shared" || textOnly === "cancelled") return;
  }

  downloadBlob(blob, fileName);

  const waMe = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const waScheme = `whatsapp://send?text=${encodeURIComponent(text)}`;
  if (isMobileWeb()) {
    openExternalUrl(waScheme, waMe);
  }
}
