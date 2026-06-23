const STORAGE_KEY = "lk_device_id";

let memoryDeviceId: string | null = null;

function persistDeviceId(id: string) {
  memoryDeviceId = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode / WebView quota */
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

function readStoredDeviceId(): string | null {
  try {
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal && fromLocal.length >= 16) return fromLocal;
  } catch {
    /* ignore */
  }
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession && fromSession.length >= 16) return fromSession;
  } catch {
    /* ignore */
  }
  if (memoryDeviceId && memoryDeviceId.length >= 16) return memoryDeviceId;
  return null;
}

/** Stable per-browser device id (localStorage). Sent on login / OTP / register / logout. */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";

  const existing = readStoredDeviceId();
  if (existing) {
    memoryDeviceId = existing;
    return existing;
  }

  const id = crypto.randomUUID();
  persistDeviceId(id);
  return id;
}
