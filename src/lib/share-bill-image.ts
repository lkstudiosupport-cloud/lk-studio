import { openWhatsApp } from "@/lib/whatsapp";
import {
  BILL_RECEIPT_CAPTURE_ID,
  loadHtml2Canvas,
  preloadBillCaptureLib,
  waitForBillReceiptReady,
} from "@/lib/bill-receipt-capture";
import { BILL_RECEIPT_STYLES } from "@/lib/bill-receipt-styles";

const CAPTURE_WIDTH_PX = 448;
const CAPTURE_SCALE = 1.25;
const JPEG_QUALITY = 0.92;

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
  const canvas = await captureInIsolatedIframe(el);
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
  const blob = await captureBillImage();
  const resolvedName = fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
    ? fileName
    : billImageFileName(fileName.replace(/\.(png|jpe?g)$/i, ""));
  const file = new File([blob], resolvedName, { type: "image/jpeg" });
  const title = shopName ? `Bill — ${shopName}` : "Bill";

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = resolvedName;
  link.click();
  URL.revokeObjectURL(url);

  if (phone) {
    openWhatsApp(phone, fallbackHint ?? "Your bill image is saved. Please attach it in WhatsApp.");
  }
}
