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

function publicUrlForKey(key: string): string {
  const base = process.env.S3_PUBLIC_URL?.trim()?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  const bucket = process.env.S3_BUCKET!.trim();
  const region = process.env.S3_REGION?.trim() || "ap-south-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function saveToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.S3_REGION?.trim() || "ap-south-1",
    endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
    },
    forcePathStyle: Boolean(process.env.S3_ENDPOINT?.trim()),
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!.trim(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return publicUrlForKey(key);
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

  if (s3Configured()) {
    return saveToS3(buffer, key, file.type || guessContentType(ext));
  }

  if (isProductionHosting()) {
    throw new Error(
      "File storage not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY."
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

  if (s3Configured()) {
    const key = normalized.startsWith("assets/") ? normalized : `assets/${normalized}`;
    return saveToS3(buffer, key, contentType);
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

  if (s3Configured()) {
    try {
      const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({
        region: process.env.S3_REGION?.trim() || "ap-south-1",
        endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
        },
        forcePathStyle: Boolean(process.env.S3_ENDPOINT?.trim()),
      });
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
