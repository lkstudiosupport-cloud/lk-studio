import { withTimeout } from "@/lib/platform";

export const BILL_RECEIPT_CAPTURE_ID = "bill-receipt-capture";

const CAPTURE_READY_MAX_MS = 5000;
const CAPTURE_CANVAS_TIMEOUT_MS = 12000;

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
        new Promise<void>((resolve) => window.setTimeout(resolve, 600)),
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

const CAPTURE_SCALE = 1.25;

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
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
}

/** Capture the on-page receipt element (preferred — uses live styles). */
export async function captureReceiptCanvas(el: HTMLElement) {
  await waitForImages(el);
  const html2canvas = await loadHtml2Canvas();
  return withTimeout(
    html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: CAPTURE_SCALE,
      logging: false,
      useCORS: true,
      width: el.offsetWidth || el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.offsetWidth || el.scrollWidth,
      windowHeight: el.scrollHeight,
    }),
    CAPTURE_CANVAS_TIMEOUT_MS,
    "Bill image capture timed out"
  );
}
