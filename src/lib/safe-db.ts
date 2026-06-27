/** True for transient Postgres / Prisma pool errors worth one retry. */
export function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String((err as { code: unknown }).code) : "";
  if (code === "P1001" || code === "P1002" || code === "P2024") return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Connection terminated") ||
    msg.includes("max clients reached") ||
    msg.includes("Timed out fetching a new connection") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT")
  );
}

export async function withDbRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0 && isTransientDbError(err)) {
      await new Promise((r) => setTimeout(r, 250));
      return withDbRetry(fn, retries - 1);
    }
    throw err;
  }
}
