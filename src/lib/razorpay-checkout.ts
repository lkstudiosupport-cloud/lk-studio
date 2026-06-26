import { isCapacitorNative, isMobileWeb } from "@/lib/platform";

/** Razorpay expects E.164; default +91 for 10-digit Indian mobiles. */
export function formatRazorpayContact(phone: string | null | undefined): string | undefined {
  if (!phone?.trim()) return undefined;
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return trimmed;
}

/** Razorpay Standard Checkout — UPI mandate (PhonePe, GPay, Paytm via intent on mobile). */
export function razorpayUpiCheckoutOptions() {
  const mobile = isCapacitorNative() || isMobileWeb();

  return {
    /** Required for subscription / mandate checkout. */
    recurring: "1",
    /** UPI Autopay mandate — required for recurring authorisation. */
    method: { upi: true },
    /** Opens installed UPI apps from WebView / mobile browser. */
    ...(mobile ? { webview_intent: true as const } : {}),
    ...(mobile
      ? {
          config: {
            display: {
              blocks: {
                upi_apps: {
                  name: "UPI — PhonePe, GPay, Paytm",
                  instruments: ["gpay", "phonepe", "paytm", "any"],
                },
              },
              sequence: ["block.upi_apps", "upi"],
              preferences: {
                /** Keep default UPI block if custom instruments are unavailable. */
                show_default_blocks: true,
              },
            },
          },
        }
      : {}),
  };
}
