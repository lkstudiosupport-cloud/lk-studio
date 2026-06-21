import { requireSession } from "@/lib/auth";

/** Require logged-in LK Studio admin (security / oversight). */
export async function requireAdminSession() {
  return requireSession(["ADMIN"]);
}
