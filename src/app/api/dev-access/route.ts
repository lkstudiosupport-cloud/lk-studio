import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

/** Dev only — public tunnel URL for phone (any network). */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ tunnelUrl: null, lanUrl: null });
  }

  let tunnelUrl: string | null = null;
  const tunnelFile = join(process.cwd(), ".env.tunnel");
  if (existsSync(tunnelFile)) {
    const text = readFileSync(tunnelFile, "utf8");
    const m = text.match(/^TUNNEL_URL=(.+)$/m);
    if (m) tunnelUrl = m[1].trim();
  }
  if (!tunnelUrl && process.env.TUNNEL_URL) tunnelUrl = process.env.TUNNEL_URL;

  const publicFile = join(process.cwd(), "public", "dev-access-url.txt");
  if (!tunnelUrl && existsSync(publicFile)) {
    tunnelUrl = readFileSync(publicFile, "utf8").trim() || null;
  }

  return NextResponse.json({
    tunnelUrl,
    lanUrl: null,
  });
}
