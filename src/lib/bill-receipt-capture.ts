export const BILL_RECEIPT_CAPTURE_ID = "bill-receipt-capture";

const CAPTURE_READY_MAX_MS = 2500;

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Wait until the receipt DOM exists and images are loaded (replaces fixed delays). */
export async function waitForBillReceiptReady(): Promise<HTMLElement> {
  const deadline = Date.now() + CAPTURE_READY_MAX_MS;

  while (Date.now() < deadline) {
    const el = document.getElementById(BILL_RECEIPT_CAPTURE_ID);
    if (el instanceof HTMLElement) {
      const images = Array.from(el.querySelectorAll("img"));
      const pending = images.filter((img) => !img.complete);
      if (pending.length === 0) {
        await nextPaint();
        return el;
      }
      await Promise.race([
        Promise.all(
          pending.map(
            (img) =>
              new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
          )
        ),
        new Promise<void>((resolve) => window.setTimeout(resolve, 400)),
      ]);
      await nextPaint();
      return el;
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  const el = document.getElementById(BILL_RECEIPT_CAPTURE_ID);
  if (el instanceof HTMLElement) return el;
  throw new Error("Bill receipt not ready");
}

let html2canvasModule: Promise<typeof import("html2canvas").default> | null = null;

/** Warm html2canvas while the bill page is still rendering. */
export function preloadBillCaptureLib() {
  if (typeof window === "undefined") return;
  html2canvasModule ??= import("html2canvas").then((m) => m.default);
}

export async function loadHtml2Canvas() {
  preloadBillCaptureLib();
  if (!html2canvasModule) {
    html2canvasModule = import("html2canvas").then((m) => m.default);
  }
  return html2canvasModule;
}
