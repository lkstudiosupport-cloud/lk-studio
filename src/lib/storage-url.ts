import { remoteFileStorageConfigured } from "@/lib/storage-backend";

/** Shared helpers for stored upload URLs and /api/media proxy paths. */

export function mediaProxyUrlForKey(key: string): string {
  const normalized = key.replace(/^\//, "");
  return `/api/media/${normalized}`;
}

/** True when S3_PUBLIC_URL should not be used (R2 public URLs are often broken). */
export function isUnreliablePublicStorageUrl(base: string): boolean {
  const lower = base.toLowerCase();
  return lower.includes(".r2.dev") || lower.includes("cloudflarestorage.com");
}

export function directPublicUrlAllowed(): boolean {
  const publicBase = process.env.S3_PUBLIC_URL?.trim()?.replace(/\/$/, "");
  if (!publicBase || process.env.S3_USE_PUBLIC_URL !== "true") return false;
  if (isUnreliablePublicStorageUrl(publicBase)) return false;
  if (process.env.S3_ENDPOINT?.trim()?.includes("r2.cloudflarestorage.com")) return false;
  return true;
}

/** Extract object key (uploads/… or assets/…) from a stored path or absolute URL. */
export function storageKeyFromStoredUrl(pathOrUrl: string): string | null {
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
  if (trimmed.startsWith("/assets/")) {
    return trimmed.slice(1);
  }
  if (trimmed.startsWith("assets/")) {
    return trimmed;
  }

  const publicBase = process.env.S3_PUBLIC_URL?.trim()?.replace(/\/$/, "");
  if (publicBase && trimmed.startsWith(`${publicBase}/`)) {
    return trimmed.slice(publicBase.length + 1);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname.replace(/^\//, "");

      if (url.hostname.includes(".r2.dev")) {
        return pathname.replace(/^\//, "");
      }

      const bucket = process.env.S3_BUCKET?.trim();
      if (bucket && url.hostname.includes("cloudflarestorage.com")) {
        if (pathname.startsWith(`${bucket}/`)) {
          return pathname.slice(bucket.length + 1);
        }
        return pathname;
      }

      if (bucket) {
        const region = process.env.S3_REGION?.trim() || "ap-south-1";
        const hostPrefix = `${bucket}.s3.${region}.amazonaws.com`;
        if (url.hostname === hostPrefix || url.hostname.startsWith(`${bucket}.s3.`)) {
          return pathname;
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

/** Normalize DB-stored paths to a browser-loadable URL (prefers /api/media proxy). */
export function normalizeStoredImageUrl(pathOrUrl: string): string {
  if (!pathOrUrl?.trim()) return pathOrUrl;

  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith("/api/media/")) return trimmed;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("/placeholder")) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const key = storageKeyFromStoredUrl(trimmed);
    if (key && (key.startsWith("uploads/") || key.startsWith("assets/"))) {
      return mediaProxyUrlForKey(key);
    }
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    const key = storageKeyFromStoredUrl(trimmed);
    if (key) return mediaProxyUrlForKey(key);
  }

  if (trimmed.startsWith("/assets/") || trimmed.startsWith("assets/")) {
    const key = storageKeyFromStoredUrl(trimmed);
    if (key && remoteFileStorageConfigured()) {
      return mediaProxyUrlForKey(key);
    }
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  return trimmed;
}

/** URL persisted after upload — always proxy for R2 / Supabase unless a verified CDN base is set. */
export function storedUrlForKey(key: string): string {
  const normalized = key.replace(/^\//, "");
  const publicBase = process.env.S3_PUBLIC_URL?.trim()?.replace(/\/$/, "");

  if (directPublicUrlAllowed() && publicBase) {
    return `${publicBase}/${normalized}`;
  }

  const hasRemote = Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim()
  );

  if (hasRemote) {
    return mediaProxyUrlForKey(normalized);
  }

  if (publicBase && !isUnreliablePublicStorageUrl(publicBase)) {
    return `${publicBase}/${normalized}`;
  }

  const bucket = process.env.S3_BUCKET?.trim();
  if (bucket) {
    const region = process.env.S3_REGION?.trim() || "ap-south-1";
    return `https://${bucket}.s3.${region}.amazonaws.com/${normalized}`;
  }

  return `/${normalized}`;
}
