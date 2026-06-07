import { openWhatsApp } from "@/lib/whatsapp";
import { isMobileWeb, withTimeout } from "@/lib/platform";
import {
  BILL_RECEIPT_CAPTURE_ID,
  captureReceiptCanvas,
  loadHtml2Canvas,
  preloadBillCaptureLib,
  waitForBillReceiptReady,
} from "@/lib/bill-receipt-capture";
import { BILL_RECEIPT_STYLES } from "@/lib/bill-receipt-styles";

const CAPTURE_WIDTH_PX = 448;
const CAPTURE_SCALE = 1.25;
const JPEG_QUALITY = 0.92;
const CAPTURE_TOTAL_TIMEOUT_MS = 15000;

export { preloadBillCaptureLib };

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
    if (!doc) throw new Error("Could not prepare bill capture");

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
      ${BILL_RECEIPT_STYLES}
    `;
    doc.head.appendChild(safeStyle);

    const clone = originalRoot.cloneNode(true) as HTMLElement;
    clone.id = BILL_RECEIPT_CAPTURE_ID;
    clone.style.width = `${CAPTURE_WIDTH_PX}px`;
    clone.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;
    doc.body.appendChild(clone);

    const images = Array.from(clone.querySelectorAll("img"));
    for (const img of images) {
      if (img.src) img.src = img.src;
    }
    await Promise.all(
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
    );

    const html2canvas = await loadHtml2Canvas();
    return await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: CAPTURE_SCALE,
      logging: false,
      useCORS: true,
      width: CAPTURE_WIDTH_PX,
      windowWidth: CAPTURE_WIDTH_PX,
      height: clone.scrollHeight,
      windowHeight: clone.scrollHeight,
    });
  } finally {
    iframe.remove();
  }
}

async function captureBillImage() {
  const el = await waitForBillReceiptReady();

  let canvas;
  try {
    canvas = await captureReceiptCanvas(el);
  } catch {
    canvas = await captureInIsolatedIframe(el);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create bill image"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

function billImageFileName(billNumber: string) {
  return `${billNumber}.jpg`;
}

function downloadBillImage(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

type WebShareResult = "shared" | "cancelled" | "unavailable" | "failed";

async function tryWebShareFile(
  file: File,
  title: string,
  text: string
): Promise<WebShareResult> {
  if (typeof navigator === "undefined" || !navigator.share) return "unavailable";
  try {
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return "unavailable";
    await navigator.share({ files: [file], title, text });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "failed";
  }
}

export async function shareBillImageOnWhatsApp({
  phone,
  fileName,
  shopName,
  fallbackHint,
}: {
  phone?: string | null;
  fileName: string;
  shopName?: string;
  fallbackHint?: string;
}) {
  preloadBillCaptureLib();

  const blob = await withTimeout(
    captureBillImage(),
    CAPTURE_TOTAL_TIMEOUT_MS,
    "Bill image capture timed out"
  );

  const resolvedName =
    fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
      ? fileName
      : billImageFileName(fileName.replace(/\.(png|jpe?g)$/i, ""));
  const file = new File([blob], resolvedName, { type: "image/jpeg" });
  const title = shopName ? `Bill — ${shopName}` : "Bill";
  const hint =
    fallbackHint ?? "Your bill image is saved. Please attach it in WhatsApp.";

  const preferWebShare = isMobileWeb() && typeof navigator !== "undefined" && !!navigator.share;
  if (preferWebShare) {
    const shareResult = await tryWebShareFile(file, title, hint);
    if (shareResult === "shared" || shareResult === "cancelled") return;
  }

  downloadBillImage(blob, resolvedName);

  if (phone?.trim()) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 400));
    openWhatsApp(phone.trim(), hint);
    return;
  }

  if (!preferWebShare) {
    throw new Error("Could not share bill image");
  }
}
