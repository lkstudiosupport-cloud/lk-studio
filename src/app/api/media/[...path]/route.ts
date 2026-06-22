import { fetchStoredObject } from "@/lib/fetch-stored-object";
import { storageBackend } from "@/lib/storage-backend";

export const runtime = "nodejs";

/** Serve uploads from Supabase Storage, R2, or S3 via app proxy. */
export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const key = path.join("/");

  if (!key.startsWith("uploads/") && !key.startsWith("assets/")) {
    return new Response("Forbidden", { status: 403 });
  }
  if (key.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const { body, contentType } = await fetchStoredObject(key);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "test") {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[media] ${key} (${storageBackend()}): ${msg}`);
    }
    return new Response("Not found", { status: 404 });
  }
}
