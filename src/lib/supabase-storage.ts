import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseStorageConfigured } from "@/lib/storage-backend";

let admin: SupabaseClient | null = null;

export { supabaseStorageConfigured };

export function supabaseBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "lk-uploads";
}

export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase Storage not configured — set STORAGE_BACKEND=supabase plus NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
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
  const payload = body instanceof Buffer ? new Uint8Array(body) : body;
  const { error } = await supabase.storage.from(bucket).upload(key, payload, {
    contentType,
    upsert: true,
    cacheControl: "604800",
  });
  if (error) {
    const hint =
      error.message.includes("Bucket not found") || error.message.includes("not found")
        ? ` Create bucket "${bucket}" in Supabase → Storage (private is OK).`
        : "";
    throw new Error(`Supabase upload failed: ${error.message}.${hint}`);
  }
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
