import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  // Dev hot reload can keep an old client after schema changes — recreate if needed.
  if (
    cached &&
    typeof cached.shopRating?.groupBy === "function" &&
    typeof cached.customerFavorite?.findMany === "function" &&
    typeof cached.priceRequest?.findMany === "function" &&
    typeof cached.loginOtp?.findFirst === "function"
  ) {
    return cached;
  }

  const client = createClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();

const dbUrl = process.env.DATABASE_URL ?? "";

/** Warn in production if SQLite is used — it does not scale to 1000+ concurrent writes. */
if (process.env.NODE_ENV === "production" && dbUrl.startsWith("file:")) {
  console.warn(
    "[lk-studio] SQLite detected in production. Switch to PostgreSQL for many users at once."
  );
}

if (
  process.env.NODE_ENV === "production" &&
  dbUrl.includes("pooler.supabase.com") &&
  !dbUrl.includes("pgbouncer=true")
) {
  console.error(
    "[lk-studio] DATABASE_URL uses Supabase pooler without ?pgbouncer=true — use direct db.<ref>.supabase.co:5432 on Render instead."
  );
}
