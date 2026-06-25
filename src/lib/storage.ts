import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { MAX_UPLOAD_BYTES } from "@/lib/limits";
import { isImageUpload, normalizeImageForStorage } from "@/lib/normalize-image";
import { storageKeyFromStoredUrl, storedUrlForKey, normalizeStoredImageUrl } from "@/lib/storage-url";
import { remoteFileStorageConfigured, storageBackend } from "@/lib/storage-backend";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function remoteStorageConfigured(): boolean {
  return remoteFileStorageConfigured();
}

function storageUrlForKey(key: string): string {
  return storedUrlForKey(key);
}

/** Save bytes to Cloudflare R2 (default), AWS S3, or opt-in Supabase Storage. */
async function saveToRemote(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const backend = storageBackend();

  if (backend === "supabase") {
    const { supabasePutObject } = await import("@/lib/supabase-storage");
    await supabasePutObject(key, buffer, contentType);
    return storageUrlForKey(key);
  }

  if (backend === "r2") {
    const { r2PutObject } = await import("@/lib/r2-object");
    try {
      await r2PutObject(key, buffer, contentType);
      return storageUrlForKey(key);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const code = e && typeof e === "object" && "code" in e ? String(e.code) : "";
      if (code === "EPROTO" || msg.includes("EPROTO") || msg.includes("handshake")) {
        throw new Error(
          "Cloudflare R2 SSL error from Render. Check S3_ENDPOINT (account-id.r2.cloudflarestorage.com), R2 API token permissions, and redeploy after env changes."
        );
      }
      throw e;
    }
  }

  if (backend === "s3") {
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

  throw new Error(
    "File storage not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT on Render (Cloudflare R2)."
  );
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
  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);
  let ext = path.extname(file.name) || ".bin";
  let contentType = file.type || guessContentType(ext);

  if (isImageUpload(file.name, contentType)) {
    const normalized = await normalizeImageForStorage(buffer, contentType);
    buffer = normalized.buffer;
    ext = normalized.ext;
    contentType = normalized.contentType;
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB)`);
  }

  const name = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const key = `uploads/${subfolder}/${name}`;

  if (remoteStorageConfigured()) {
    return saveToRemote(buffer, key, contentType);
  }

  if (isProductionHosting()) {
    throw new Error(
      "File storage not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT on Render (Cloudflare R2)."
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
  return storageKeyFromStoredUrl(pathOrUrl);
}

/** Best-effort delete of a stored upload (S3/R2 or local dev file). */
export async function deleteStoredUpload(pathOrUrl: string): Promise<void> {
  const key = storageKeyFromPath(pathOrUrl);
  if (!key) return;

  if (remoteStorageConfigured()) {
    try {
      const backend = storageBackend();
      if (backend === "supabase") {
        const { supabaseDeleteObject } = await import("@/lib/supabase-storage");
        await supabaseDeleteObject(key);
        return;
      }
      if (backend === "r2") {
        const { r2DeleteObject } = await import("@/lib/r2-object");
        await r2DeleteObject(key);
        return;
      }
      if (backend === "s3") {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const { createS3Client } = await import("@/lib/s3-client");
        const client = createS3Client();
        await client.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET!.trim(),
            Key: key,
          })
        );
      }
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
  const path = normalizeStoredImageUrl(pathOrUrl);
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!siteOrigin) return path;
  return `${siteOrigin.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}
