import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

export function supabaseStorageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function storageBackend(): "supabase" | "s3" | "local" {
  const forced = process.env.STORAGE_BACKEND?.trim().toLowerCase();
  if (forced === "supabase") return "supabase";
  if (forced === "s3" || forced === "r2") return "s3";
  if (supabaseStorageConfigured()) return "supabase";
  if (
    process.env.S3_BUCKET?.trim() &&
    process.env.S3_ACCESS_KEY_ID?.trim() &&
    process.env.S3_SECRET_ACCESS_KEY?.trim()
  ) {
    return "s3";
  }
  return "local";
}

export function supabaseBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "lk-uploads";
}

export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export async function supabasePutObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const bucket = supabaseBucket();
  const { error } = await supabase.storage.from(bucket).upload(key, body, {
    contentType,
    upsert: true,
    cacheControl: "604800",
  });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
}

export async function supabaseGetObject(
  key: string
): Promise<{ body: Buffer; contentType: string }> {
  const supabase = getSupabaseAdmin();
  const bucket = supabaseBucket();
  const { data, error } = await supabase.storage.from(bucket).download(key);
  if (error || !data) throw new Error(`Supabase download failed: ${error?.message ?? "missing"}`);
  const arrayBuffer = await data.arrayBuffer();
  const contentType = data.type || "application/octet-stream";
  return { body: Buffer.from(arrayBuffer), contentType };
}

export async function supabaseDeleteObject(key: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const bucket = supabaseBucket();
  const { error } = await supabase.storage.from(bucket).remove([key]);
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}
