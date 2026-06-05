/** Open UPI / PhonePe / GPay deep links — works in mobile browser and Capacitor WebView. */
export function openPaymentDeepLink(url: string) {
  if (typeof window === "undefined") return;

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => {
    window.location.href = url;
  }, 400);
}
