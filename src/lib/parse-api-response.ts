export async function parseApiResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) {
    return { error: res.ok ? "Empty server response" : `Request failed (${res.status})` };
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: "Server returned invalid response. Is npm run mobile:dev running?" };
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
