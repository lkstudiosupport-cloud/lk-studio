import { isCapacitorNative, isMobileWeb, withTimeout } from "@/lib/platform";
import {
  captureReceiptCanvas,
  loadHtml2Canvas,
  preloadBillCaptureLib,
  waitForCaptureElement,
  getBillCaptureScale,
} from "@/lib/bill-receipt-capture";
import { BILL_RECEIPT_STYLES } from "@/lib/bill-receipt-styles";
import { SALARY_INVOICE_CAPTURE_ID } from "@/lib/shop-attendance";

const CAPTURE_WIDTH_PX = 448;
const JPEG_QUALITY = 0.94;
const CAPTURE_TOTAL_TIMEOUT_MS = 12000;

export { preloadBillCaptureLib };

type ShareResult = "shared" | "cancelled" | "unavailable" | "failed";
export type ShareSalaryOutcome = "shared" | "cancelled" | "downloaded";

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
    if (!doc) throw new Error("Could not prepare salary capture");

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
    clone.id = SALARY_INVOICE_CAPTURE_ID;
    clone.style.width = `${CAPTURE_WIDTH_PX}px`;
    clone.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;
    doc.body.appendChild(clone);

    const html2canvas = await loadHtml2Canvas();
    return await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: getBillCaptureScale(),
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

async function captureSalaryBlob() {
  const el = await waitForCaptureElement(SALARY_INVOICE_CAPTURE_ID);
  let canvas;
  try {
    canvas = await captureReceiptCanvas(el);
  } catch {
    canvas = await captureInIsolatedIframe(el);
  }
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create salary image"))),
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

async function tryCapacitorNativeShare(
  blob: Blob,
  fileName: string,
  title: string,
  text: string
): Promise<ShareResult> {
  if (!isCapacitorNative()) return "unavailable";
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const base64 = await blobToBase64(blob);
    const path = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path });
    const { Share } = await import("@capacitor/share");
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

function downloadImage(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Share the on-screen salary invoice paper as an image (same flow as bill). */
export async function shareSalaryInvoiceImage(opts: {
  fileName: string;
  shopName?: string;
  caption?: string;
}): Promise<ShareSalaryOutcome> {
  preloadBillCaptureLib();
  const blob = await withTimeout(
    captureSalaryBlob(),
    CAPTURE_TOTAL_TIMEOUT_MS,
    "Salary image capture timed out"
  );
  const fileName = opts.fileName.endsWith(".jpg") ? opts.fileName : `${opts.fileName}.jpg`;
  const file = new File([blob], fileName, { type: "image/jpeg" });
  const title = opts.shopName ? `Salary — ${opts.shopName}` : "Salary invoice";
  const text = opts.caption ?? title;

  if (isCapacitorNative()) {
    const nativeResult = await tryCapacitorNativeShare(blob, fileName, title, text);
    if (nativeResult === "shared" || nativeResult === "cancelled") return nativeResult;
    downloadImage(blob, fileName);
    return "downloaded";
  }

  if (isMobileWeb() && typeof navigator !== "undefined" && "share" in navigator) {
    try {
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return "shared";
      }
    } catch (err) {
      if (isShareCancelled(err)) return "cancelled";
    }
  }

  downloadImage(blob, fileName);
  return "downloaded";
}
