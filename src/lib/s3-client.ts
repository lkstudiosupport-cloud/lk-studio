import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "node:https";

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
      "S3_ENDPOINT must be https://<ACCOUNT_ID>.r2.cloudflarestorage.com — not the pub-xxx.r2.dev public URL."
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

  if (process.env.S3_USE_PUBLIC_URL === "true") {
    requireEnv("S3_PUBLIC_URL");
  }

  const endpoint = process.env.S3_ENDPOINT?.trim() ?? "";
  if (endpoint) resolveS3Endpoint();
}

export function publicAssetBaseUrl(): string {
  const v = process.env.S3_PUBLIC_URL?.trim();
  if (!v) return "(using /api/media proxy)";
  return v.replace(/\/$/, "");
}

/** Stored image URL — defaults to /api/media/ (no R2 public URL required). */
export function publicUrlForKey(key: string): string {
  const normalized = key.replace(/^\//, "");
  const publicBase = process.env.S3_PUBLIC_URL?.trim()?.replace(/\/$/, "");

  if (process.env.S3_USE_PUBLIC_URL === "true" && publicBase) {
    return `${publicBase}/${normalized}`;
  }

  return `/api/media/${normalized}`;
}

export function createS3Client(): S3Client {
  validateS3Env();
  const endpoint = resolveS3Endpoint();

  const requestHandler = new NodeHttpHandler({
    httpsAgent: new https.Agent({
      keepAlive: true,
      minVersion: "TLSv1.2",
    }),
    connectionTimeout: 30_000,
    requestTimeout: 120_000,
  });

  return new S3Client({
    region: resolveS3Region(),
    endpoint,
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: Boolean(endpoint),
    requestHandler,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  } as ConstructorParameters<typeof S3Client>[0]);
}

export function logS3ConfigHint(): void {
  const endpoint = process.env.S3_ENDPOINT?.trim() ?? "(not set)";
  const region = resolveS3Region();
  const bucket = process.env.S3_BUCKET?.trim() ?? "(not set)";
  console.log(`S3 bucket=${bucket} region=${region}`);
  console.log(`S3 endpoint=${endpoint}`);
  console.log(`Image URLs=${publicAssetBaseUrl()}`);
}
