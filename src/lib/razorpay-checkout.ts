import { isCapacitorNative, isMobileWeb } from "@/lib/platform";

/** Razorpay Standard Checkout — PhonePe, GPay, Paytm via UPI intent. */
export function razorpayUpiCheckoutOptions() {
  const useUpiIntent = isCapacitorNative() || isMobileWeb();

  return {
    /** Required for subscription / mandate checkout. */
    recurring: "1",
    /** Opens installed UPI apps from WebView / mobile browser (not desktop QR). */
    ...(useUpiIntent ? { webview_intent: true as const } : {}),
    config: {
      display: {
        blocks: {
          upi_apps: {
            name: "UPI — PhonePe, GPay, Paytm",
            instruments: ["gpay", "phonepe", "paytm", "any"],
          },
        },
        sequence: ["block.upi_apps"],
        preferences: {
          show_default_blocks: false,
        },
      },
    },
  };
}
