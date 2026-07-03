function errorForNonJsonResponse(res: Response, text: string): string {
  const status = res.status;
  const snippet = text.trim().slice(0, 80).toLowerCase();

  if (status === 401 || status === 403) {
    return "Session expired — log in again and retry.";
  }
  if (status === 413 || snippet.includes("too large") || snippet.includes("entity too large")) {
    return "Photo too large — upload fewer images at once or use smaller photos.";
  }
  if (status === 502 || status === 503 || status === 504 || snippet.includes("<!doctype html")) {
    return `Server busy or timed out (${status}). Upload 5–10 photos at a time, wait a minute, then retry.`;
  }
  if (snippet.startsWith("<!doctype") || snippet.startsWith("<html")) {
    return `Server returned a web page instead of data (${status}). Check Render is Live, then retry.`;
  }
  if (status >= 500) {
    return `Server error (${status}). Try again in a minute.`;
  }
  return `Unexpected server response (${status}). Try again or upload fewer photos at once.`;
}

export async function parseApiResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) {
    return { error: res.ok ? "Empty server response" : `Request failed (${res.status})` };
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: errorForNonJsonResponse(res, text) };
  }
}

/** Turn fetch() network failures into a readable message (undici: "fetch failed"). */
export function formatFetchError(err: unknown, fallback = "Request failed"): string {
  if (!(err instanceof Error)) return fallback;
  const cause = err.cause instanceof Error ? err.cause.message : "";
  if (/fetch failed|failed to fetch/i.test(err.message)) {
    return cause
      ? `Network error: ${cause}`
      : "Network error — server unreachable or timed out (Render may be waking up).";
  }
  return cause ? `${err.message} (${cause})` : err.message;
}

/** fetch + JSON parse with network error handling. */
export async function fetchApi(
  url: string,
  init?: RequestInit
): Promise<{ res: Response; data: Record<string, unknown> }> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: "include", ...init });
  } catch (err) {
    throw new Error(formatFetchError(err));
  }
  const data = await parseApiResponse(res);
  return { res, data };
}
