import { isR2Storage } from "@/lib/r2-object";

/** Cloudflare R2 / S3 credentials present. */
export function s3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim()
  );
}

/** Supabase Storage — opt-in only via STORAGE_BACKEND=supabase (not used for DB/auth). */
export function supabaseStorageConfigured(): boolean {
  const forced = process.env.STORAGE_BACKEND?.trim().toLowerCase();
  if (forced !== "supabase") return false;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export type StorageBackendKind = "r2" | "s3" | "supabase" | "local";

/**
 * File storage backend selection.
 * Default production stack: Render (app) + Cloudflare R2 (files).
 * Supabase is DB/auth only unless STORAGE_BACKEND=supabase is explicitly set.
 */
export function storageBackend(): StorageBackendKind {
  if (supabaseStorageConfigured()) return "supabase";
  if (isR2Storage()) return "r2";
  if (s3Configured()) return "s3";
  return "local";
}

export function remoteFileStorageConfigured(): boolean {
  return storageBackend() !== "local";
}
