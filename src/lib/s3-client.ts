import { S3Client } from "@aws-sdk/client-s3";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name} — set R2/S3 env vars on Render.`);
  return v;
}

/** Cloudflare R2 API host — NOT the pub-xxx.r2.dev public URL. */
export function resolveS3Endpoint(): string | undefined {
  const raw = process.env.S3_ENDPOINT?.trim();
  if (!raw) return undefined;

  if (raw.includes(".r2.dev")) {
    throw new Error(
      "S3_ENDPOINT must be https://<ACCOUNT_ID>.r2.cloudflarestorage.com — not the pub-xxx.r2.dev public URL (that is S3_PUBLIC_URL only)."
    );
  }

  return raw.replace(/\/$/, "");
}

export function resolveS3Region(): string {
  const endpoint = process.env.S3_ENDPOINT?.trim() ?? "";
  const publicUrl = process.env.S3_PUBLIC_URL?.trim() ?? "";
  if (endpoint.includes("r2.cloudflarestorage.com") || publicUrl.includes(".r2.dev")) {
    return "auto";
  }
  return process.env.S3_REGION?.trim() || "ap-south-1";
}

export function validateS3Env(): void {
  requireEnv("S3_BUCKET");
  requireEnv("S3_ACCESS_KEY_ID");
  requireEnv("S3_SECRET_ACCESS_KEY");
  requireEnv("S3_PUBLIC_URL");

  const publicUrl = process.env.S3_PUBLIC_URL!.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim() ?? "";

  if (publicUrl.includes(".r2.dev") && !endpoint) {
    throw new Error(
      "R2 detected (S3_PUBLIC_URL uses .r2.dev) but S3_ENDPOINT is missing. Set S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
    );
  }

  resolveS3Endpoint();
}

export function createS3Client(): S3Client {
  validateS3Env();
  const endpoint = resolveS3Endpoint();

  return new S3Client({
    region: resolveS3Region(),
    endpoint,
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
    /** Required for Cloudflare R2 and most S3-compatible endpoints. */
    forcePathStyle: Boolean(endpoint),
  });
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function logS3ConfigHint(): void {
  const endpoint = process.env.S3_ENDPOINT?.trim() ?? "(not set)";
  const region = resolveS3Region();
  const bucket = process.env.S3_BUCKET?.trim() ?? "(not set)";
  const publicUrl = process.env.S3_PUBLIC_URL?.trim() ?? "(not set)";
  console.log(`S3 bucket=${bucket} region=${region}`);
  console.log(`S3 endpoint=${endpoint}`);
  console.log(`S3 public URL=${publicUrl}`);
}
