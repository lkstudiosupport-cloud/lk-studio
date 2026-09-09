export type NetworkKind = "wifi" | "cellular" | "unknown" | "offline";

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

/**
 * Best-effort connection kind for Capacitor WebView / browsers.
 * Prefer Network Information API; fall back to unknown when online.
 */
export function detectNetworkKind(): NetworkKind {
  if (typeof navigator === "undefined") return "unknown";
  if (navigator.onLine === false) return "offline";

  const conn = (
    navigator as Navigator & {
      connection?: { type?: string; effectiveType?: string };
      mozConnection?: { type?: string; effectiveType?: string };
      webkitConnection?: { type?: string; effectiveType?: string };
    }
  ).connection ||
    (navigator as Navigator & { mozConnection?: { type?: string; effectiveType?: string } })
      .mozConnection ||
    (navigator as Navigator & { webkitConnection?: { type?: string; effectiveType?: string } })
      .webkitConnection;

  const type = (conn?.type || "").toLowerCase();
  if (type === "wifi" || type === "ethernet" || type === "wimax") return "wifi";
  if (type === "cellular" || type === "2g" || type === "3g" || type === "4g") return "cellular";

  const effective = (conn?.effectiveType || "").toLowerCase();
  if (effective === "slow-2g" || effective === "2g" || effective === "3g") return "cellular";

  return "unknown";
}

export function shouldAutoSyncOnNetwork(
  kind: NetworkKind,
  settings: { wifi: boolean; mobileData: boolean }
): boolean {
  if (kind === "offline") return false;
  if (kind === "wifi") return settings.wifi;
  if (kind === "cellular") return settings.mobileData;
  // unknown: treat like Wi‑Fi preference (allow when wifi enabled)
  return settings.wifi;
}
