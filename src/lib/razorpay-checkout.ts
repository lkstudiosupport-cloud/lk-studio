/** Razorpay Standard Checkout — UPI first (PhonePe, GPay, Paytm via intent). */
export function razorpayUpiCheckoutOptions() {
  return {
    /** Required for subscription / mandate checkout. */
    recurring: "1",
    config: {
      display: {
        blocks: {
          upi_apps: {
            name: "UPI — PhonePe, GPay, Paytm",
            instruments: [
              {
                method: "upi",
                flows: ["intent", "collect"],
              },
            ],
          },
        },
        sequence: ["block.upi_apps", "upi"],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
  };
}
