import { storageBackend, supabaseGetObject } from "@/lib/supabase-storage";
import { r2GetObject, isR2Storage } from "@/lib/r2-object";
import { createS3Client } from "@/lib/s3-client";

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
    if (storageBackend() === "supabase") {
      const { body, contentType } = await supabaseGetObject(key);
      return new Response(new Uint8Array(body), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    }

    if (isR2Storage()) {
      const { body, contentType } = await r2GetObject(key);
      return new Response(new Uint8Array(body), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    }

    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = createS3Client();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: key,
      })
    );

    if (!res.Body) return new Response("Not found", { status: 404 });

    const bytes = await res.Body.transformToByteArray();
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": res.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
