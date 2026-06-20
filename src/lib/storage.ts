import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { MAX_UPLOAD_BYTES } from "@/lib/limits";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function s3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim()
  );
}

function remoteStorageConfigured(): boolean {
  return (
    s3Configured() ||
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    )
  );
}

function storageUrlForKey(key: string): string {
  const normalized = key.replace(/^\//, "");
  const publicBase = process.env.S3_PUBLIC_URL?.trim()?.replace(/\/$/, "");

  if (process.env.S3_USE_PUBLIC_URL === "true" && publicBase) {
    return `${publicBase}/${normalized}`;
  }

  if (remoteStorageConfigured()) {
    return `/api/media/${normalized}`;
  }

  if (publicBase) return `${publicBase}/${normalized}`;

  const bucket = process.env.S3_BUCKET!.trim();
  const region = process.env.S3_REGION?.trim() || "ap-south-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${normalized}`;
}

/** Save bytes to remote storage (Supabase preferred on Render; R2 via fetch; else AWS SDK). */
async function saveToRemote(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const { storageBackend } = await import("@/lib/supabase-storage");

  if (storageBackend() === "supabase") {
    const { supabasePutObject } = await import("@/lib/supabase-storage");
    await supabasePutObject(key, buffer, contentType);
    return storageUrlForKey(key);
  }

  const { isR2Storage, r2PutObject } = await import("@/lib/r2-object");

  if (isR2Storage()) {
    try {
      await r2PutObject(key, buffer, contentType);
      return storageUrlForKey(key);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const code = e && typeof e === "object" && "code" in e ? String(e.code) : "";
      if (code === "EPROTO" || msg.includes("EPROTO") || msg.includes("handshake")) {
        throw new Error(
          "R2 SSL error on server. Set SUPABASE_SERVICE_ROLE_KEY + STORAGE_BACKEND=supabase on Render (see Supabase → Storage → bucket lk-uploads)."
        );
      }
      throw e;
    }
  }

  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { createS3Client } = await import("@/lib/s3-client");
  const client = createS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!.trim(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return storageUrlForKey(key);
}

async function saveToLocal(buffer: Buffer, subfolder: string, name: string): Promise<string> {
  const dir = path.join(UPLOAD_DIR, subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/${subfolder}/${name}`;
}

function guessContentType(ext: string): string {
  const e = ext.toLowerCase();
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".png") return "image/png";
  if (e === ".webp") return "image/webp";
  if (e === ".gif") return "image/gif";
  if (e === ".mp3") return "audio/mpeg";
  if (e === ".m4a") return "audio/mp4";
  if (e === ".wav") return "audio/wav";
  if (e === ".webm") return "audio/webm";
  return "application/octet-stream";
}

/** Save upload to S3/R2 when configured, else local public/uploads (dev only). */
export async function saveUpload(file: File, subfolder: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB)`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".bin";
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const key = `uploads/${subfolder}/${name}`;

  if (remoteStorageConfigured()) {
    return saveToRemote(buffer, key, file.type || guessContentType(ext));
  }

  if (isProductionHosting()) {
    throw new Error(
      "File storage not configured. Set SUPABASE_SERVICE_ROLE_KEY (recommended) or S3_* on Render."
    );
  }

  return saveToLocal(buffer, subfolder, name);
}

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * Save catalog design image — S3/R2 when configured (persists on Render),
 * else public/assets/ (local dev or ephemeral Render until next deploy).
 */
export async function saveCatalogAsset(
  buffer: Buffer,
  assetPath: string,
  contentType = "image/jpeg"
): Promise<string> {
  const normalized = assetPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const filename = path.basename(normalized);

  if (remoteStorageConfigured()) {
    const key = normalized.startsWith("assets/") ? normalized : `assets/${normalized}`;
    return saveToRemote(buffer, key, contentType);
  }

  const full = path.join(PUBLIC_DIR, normalized);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);

  if (isProductionHosting()) {
    console.warn(
      `[catalog] Saved ${filename} to disk only — set S3_* env vars so images survive redeploy.`
    );
  }

  return `/${normalized}`;
}

function isProductionHosting(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

/** Extract S3 object key from a stored path or public URL. */
function storageKeyFromPath(pathOrUrl: string): string | null {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/api/media/")) {
    return trimmed.slice("/api/media/".length);
  }

  if (trimmed.startsWith("api/media/")) {
    return trimmed.slice("api/media/".length);
  }

  if (trimmed.startsWith("/uploads/")) {
    return trimmed.slice(1);
  }

  if (trimmed.startsWith("uploads/")) {
    return trimmed;
  }

  const publicBase = process.env.S3_PUBLIC_URL?.trim()?.replace(/\/$/, "");
  if (publicBase && trimmed.startsWith(`${publicBase}/`)) {
    return trimmed.slice(publicBase.length + 1);
  }

  const bucket = process.env.S3_BUCKET?.trim();
  if (bucket) {
    const region = process.env.S3_REGION?.trim() || "ap-south-1";
    const hostPrefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
    if (trimmed.startsWith(hostPrefix)) {
      return trimmed.slice(hostPrefix.length);
    }
  }

  return null;
}

/** Best-effort delete of a stored upload (S3/R2 or local dev file). */
export async function deleteStoredUpload(pathOrUrl: string): Promise<void> {
  const key = storageKeyFromPath(pathOrUrl);
  if (!key) return;

  if (remoteStorageConfigured()) {
    try {
      const { storageBackend, supabaseDeleteObject } = await import("@/lib/supabase-storage");
      if (storageBackend() === "supabase") {
        await supabaseDeleteObject(key);
        return;
      }

      const { isR2Storage, r2DeleteObject } = await import("@/lib/r2-object");
      if (isR2Storage()) {
        await r2DeleteObject(key);
        return;
      }

      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const { createS3Client } = await import("@/lib/s3-client");
      const client = createS3Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!.trim(),
          Key: key,
        })
      );
    } catch {
      // ignore — DB row is still removed
    }
    return;
  }

  if (!key.startsWith("uploads/")) return;
  const localPath = path.join(process.cwd(), "public", key);
  try {
    await unlink(localPath);
  } catch {
    // ignore missing file
  }
}

/** Resolve display URL (already absolute from S3, or site-relative local). */
export function resolvePublicAssetUrl(pathOrUrl: string, siteOrigin?: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  if (!siteOrigin) return pathOrUrl;
  return `${siteOrigin.replace(/\/$/, "")}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
