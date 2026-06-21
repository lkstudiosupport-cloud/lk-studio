import { isR2Storage, r2GetObject } from "@/lib/r2-object";
import { createS3Client } from "@/lib/s3-client";
import {
  storageBackend,
  supabaseGetObject,
  supabaseStorageConfigured,
} from "@/lib/supabase-storage";

export type StoredObject = { body: Buffer; contentType: string };

async function getFromSupabase(key: string): Promise<StoredObject> {
  return supabaseGetObject(key);
}

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

/** Read object from configured backend, with fallback when migrating between R2 and Supabase. */
export async function fetchStoredObject(key: string): Promise<StoredObject> {
  const primary = storageBackend();
  const readers: Array<{ name: string; read: () => Promise<StoredObject> }> = [];

  if (primary === "supabase") {
    readers.push({ name: "supabase", read: () => getFromSupabase(key) });
    if (isR2Storage()) readers.push({ name: "r2", read: () => getFromR2(key) });
  } else if (isR2Storage()) {
    readers.push({ name: "r2", read: () => getFromR2(key) });
    if (supabaseStorageConfigured()) {
      readers.push({ name: "supabase", read: () => getFromSupabase(key) });
    }
  } else if (primary === "s3") {
    readers.push({ name: "s3", read: () => getFromS3Sdk(key) });
    if (isR2Storage()) readers.push({ name: "r2", read: () => getFromR2(key) });
    if (supabaseStorageConfigured()) {
      readers.push({ name: "supabase", read: () => getFromSupabase(key) });
    }
  }

  if (readers.length === 0) {
    throw new Error("No storage backend configured");
  }

  const errors: string[] = [];
  for (const { name, read } of readers) {
    try {
      return await read();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${name}: ${msg}`);
    }
  }

  throw new Error(errors.join(" | "));
}
