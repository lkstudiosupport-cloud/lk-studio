import { isR2Storage, r2GetObject } from "@/lib/r2-object";
import { createS3Client } from "@/lib/s3-client";
import { storageBackend } from "@/lib/storage-backend";
import { supabaseGetObject } from "@/lib/supabase-storage";

export type StoredObject = { body: Buffer; contentType: string };

async function getFromR2(key: string): Promise<StoredObject> {
  return r2GetObject(key);
}

async function getFromS3Sdk(key: string): Promise<StoredObject> {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = createS3Client();
  const res = await client.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!.trim(),
      Key: key,
    })
  );
  if (!res.Body) throw new Error("S3 object missing body");
  const bytes = await res.Body.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    contentType: res.ContentType ?? "application/octet-stream",
  };
}

/** Read object from Cloudflare R2 (default), S3, or opt-in Supabase Storage. */
export async function fetchStoredObject(key: string): Promise<StoredObject> {
  const backend = storageBackend();

  if (backend === "r2") {
    return getFromR2(key);
  }
  if (backend === "s3") {
    if (isR2Storage()) return getFromR2(key);
    return getFromS3Sdk(key);
  }
  if (backend === "supabase") {
    return supabaseGetObject(key);
  }

  throw new Error(
    "File storage not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT on Render (Cloudflare R2)."
  );
}
