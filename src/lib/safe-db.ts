/** True for transient Postgres / Prisma pool errors worth one retry. */
export function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String((err as { code: unknown }).code) : "";
  if (code === "P1001" || code === "P1002" || code === "P1008" || code === "P1017" || code === "P2024") {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("does not exist") || msg.includes("Invalid `prisma")) return false;
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Connection terminated") ||
    msg.includes("max clients reached") ||
    msg.includes("Too many connections") ||
    msg.includes("Timed out fetching a new connection") ||
    msg.includes("Server has closed the connection") ||
    msg.includes("Connection pool timeout") ||
    msg.includes("timeout") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNREFUSED")
  );
}

export async function withDbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries && isTransientDbError(err)) {
        await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
