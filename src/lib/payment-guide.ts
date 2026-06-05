/** Platform UPI ID for subscription payments — set in server .env */
export function platformUpiId() {
  return process.env.LKSTUDIO_UPI_ID?.trim() || "lkstudio@ybl";
}

export function platformPayeeName() {
  return process.env.LKSTUDIO_PAYEE_NAME?.trim() || "LK Studio";
}

export function buildUpiPayUrl(input: {
  amountInr: number;
  note: string;
  app?: "phonepe" | "gpay" | "generic";
}) {
  const params = new URLSearchParams({
    pa: platformUpiId(),
    pn: platformPayeeName(),
    am: input.amountInr.toFixed(2),
    cu: "INR",
    tn: input.note.slice(0, 80),
  });
  const query = params.toString();
  if (input.app === "phonepe") return `phonepe://pay?${query}`;
  if (input.app === "gpay") return `gpay://upi/pay?${query}`;
  return `upi://pay?${query}`;
}

/** Fallback if app-specific scheme fails — opens Android/iOS UPI chooser. */
export function buildGenericUpiPayUrl(input: { amountInr: number; note: string }) {
  return buildUpiPayUrl({ ...input, app: "generic" });
}
