import { isCapacitorNative, isMobileWeb, withTimeout } from "@/lib/platform";
import {
  BILL_CAPTURE_SCALE,
  BILL_RECEIPT_CAPTURE_ID,
  captureReceiptCanvas,
  loadHtml2Canvas,
  preloadBillCaptureLib,
  waitForBillReceiptReady,
} from "@/lib/bill-receipt-capture";
import { BILL_RECEIPT_STYLES } from "@/lib/bill-receipt-styles";

const CAPTURE_WIDTH_PX = 448;
const JPEG_QUALITY = 0.88;
const CAPTURE_TOTAL_TIMEOUT_MS = 12000;

export { preloadBillCaptureLib };

export type ShareBillOutcome = "shared" | "cancelled" | "downloaded";

type ShareResult = "shared" | "cancelled" | "unavailable" | "failed";

let cachedBillBlob: { key: string; blob: Blob } | null = null;

/** Cache key must change when bill line items change (e.g. after edit). */
export function billShareCacheKey(billNumber: string, itemsJson: string, amount: number) {
  return `${billNumber}:${amount}:${itemsJson}`;
}

export function clearBillShareCache() {
  cachedBillBlob = null;
}

function isShareCancelled(err: unknown) {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("cancel") ||
    msg.includes("canceled") ||
    msg.includes("dismiss") ||
    msg.includes("user") ||
    msg.includes("abort") ||
    msg.includes("closed")
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
      new Promise<void>((resolve) => window.setTimeout(resolve, 300)),
    ]);

    const html2canvas = await loadHtml2Canvas();
    return await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: BILL_CAPTURE_SCALE,
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

async function getBillImageBlob(cacheKey: string) {
  if (cachedBillBlob?.key === cacheKey) return cachedBillBlob.blob;
  const blob = await withTimeout(
    captureBillImage(),
    CAPTURE_TOTAL_TIMEOUT_MS,
    "Bill image capture timed out"
  );
  cachedBillBlob = { key: cacheKey, blob };
  return blob;
}

function billImageFileName(billNumber: string) {
  return `${billNumber}.jpg`;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
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

async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read bill image"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read bill image"));
    reader.readAsDataURL(blob);
  });
}

async function writeCapacitorShareFile(blob: Blob, fileName: string) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const base64 = await blobToBase64(blob);
  const path = safeFileName(fileName);

  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache,
  });

  const { uri } = await Filesystem.getUri({
    directory: Directory.Cache,
    path,
  });

  return uri;
}

async function tryCapacitorNativeShare(
  blob: Blob,
  fileName: string,
  title: string,
  text: string
): Promise<ShareResult> {
  if (!isCapacitorNative()) return "unavailable";

  try {
    const fileUri = await writeCapacitorShareFile(blob, fileName);
    const { Share } = await import("@capacitor/share");
    try {
      await Share.share({
        title,
        text,
        files: [fileUri],
        dialogTitle: title,
      });
    } catch (shareErr) {
      // Android often rejects after a successful share or when the user dismisses the sheet.
      if (isShareCancelled(shareErr)) return "cancelled";
      return "shared";
    }
    return "shared";
  } catch {
    return "failed";
  }
}

async function tryWebShareFile(file: File, title: string, text: string): Promise<ShareResult> {
  if (typeof navigator === "undefined" || !("share" in navigator)) return "unavailable";
  try {
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return "unavailable";
    await navigator.share({ files: [file], title, text });
    return "shared";
  } catch (err) {
    if (isShareCancelled(err)) return "cancelled";
    return "failed";
  }
}

function fallbackDownloadBillImage(blob: Blob, fileName: string) {
  downloadBillImage(blob, fileName);
}

export async function shareBillImage({
  fileName,
  shopName,
  fallbackHint,
  cacheKey,
}: {
  fileName: string;
  shopName?: string;
  fallbackHint?: string;
  /** Include bill content (itemsJson) so edits produce a fresh capture. */
  cacheKey?: string;
}): Promise<ShareBillOutcome> {
  preloadBillCaptureLib();

  const resolvedName =
    fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
      ? fileName
      : billImageFileName(fileName.replace(/\.(png|jpe?g)$/i, ""));

  const blob = await getBillImageBlob(cacheKey ?? resolvedName);

  const file = new File([blob], resolvedName, { type: "image/jpeg" });
  const title = shopName ? `Bill — ${shopName}` : "Bill";
  const hint =
    fallbackHint ?? "Your bill image is saved. Open your app and attach the saved image.";

  if (isCapacitorNative()) {
    const nativeResult = await tryCapacitorNativeShare(blob, resolvedName, title, hint);
    if (nativeResult === "shared" || nativeResult === "cancelled") return nativeResult;
    fallbackDownloadBillImage(blob, resolvedName);
    return "downloaded";
  }

  if (isMobileWeb() && typeof navigator !== "undefined" && "share" in navigator) {
    const shareResult = await tryWebShareFile(file, title, hint);
    if (shareResult === "shared" || shareResult === "cancelled") return shareResult;
  }

  fallbackDownloadBillImage(blob, resolvedName);
  return "downloaded";
}
