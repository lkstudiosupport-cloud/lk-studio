import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createS3Client } from "@/lib/s3-client";

export const runtime = "nodejs";

/** Serve R2/S3 uploads through the app when pub-xxx.r2.dev public access is off. */
export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const key = path.join("/");

  if (!key.startsWith("uploads/") || key.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
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
