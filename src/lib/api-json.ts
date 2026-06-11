/** Parse JSON from a fetch Response; avoids `.json()` on empty or non-JSON bodies. */
export async function readApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok ? "Empty server response" : `Request failed (${res.status})`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid server response (${res.status})`);
  }
}
