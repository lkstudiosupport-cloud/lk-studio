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
  globalForPrisma.prisma = client;
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

if (process.env.NODE_ENV === "production" && dbUrl.includes("pooler.supabase.com")) {
  if (dbUrl.includes(":5432/") && !dbUrl.includes("pgbouncer=true")) {
    console.error(
      "[lk-studio] DATABASE_URL uses Supabase Session pooler (:5432). On Render use Transaction pooler :6543 with ?pgbouncer=true&connection_limit=1 — otherwise you hit “max clients reached” (pool_size 15)."
    );
  } else if (dbUrl.includes(":6543/") && !dbUrl.includes("pgbouncer=true")) {
    console.error(
      "[lk-studio] DATABASE_URL uses Supabase Transaction pooler (:6543) without ?pgbouncer=true — append ?pgbouncer=true&connection_limit=1"
    );
  }
}
