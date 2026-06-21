/**
 * Cloudflare R2 via native fetch + SigV4 (avoids AWS SDK SSL handshake failures on Render).
 * @see https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
 */
import { AwsClient } from "aws4fetch";
import { resolveS3Endpoint } from "@/lib/s3-client";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export function isR2Storage(): boolean {
  const endpoint = process.env.S3_ENDPOINT?.trim() ?? "";
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim() &&
      endpoint.includes("r2.cloudflarestorage.com")
  );
}

function awsClient(): AwsClient {
  return new AwsClient({
    accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    service: "s3",
    region: "auto",
  });
}

/** Path-style object URL for R2. */
export function r2ObjectUrl(key: string): string {
  const endpoint = resolveS3Endpoint();
  if (!endpoint) throw new Error("S3_ENDPOINT is required for R2");
  const bucket = requireEnv("S3_BUCKET");
  const normalized = key.replace(/^\//, "");
  return `${endpoint}/${bucket}/${normalized}`;
}

export async function r2PutObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const url = r2ObjectUrl(key);
  const payload = body instanceof Buffer ? new Uint8Array(body) : body;
  const res = await awsClient().fetch(url, {
    method: "PUT",
    body: payload,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.length),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

export async function r2GetObject(key: string): Promise<{ body: Buffer; contentType: string }> {
  const url = r2ObjectUrl(key);
  const res = await awsClient().fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`R2 get failed (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  return { body: Buffer.from(arrayBuffer), contentType };
}

export async function r2DeleteObject(key: string): Promise<void> {
  const url = r2ObjectUrl(key);
  const res = await awsClient().fetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed (${res.status})`);
  }
}

export async function r2ListKeys(prefix: string): Promise<string[]> {
  const endpoint = resolveS3Endpoint();
  const bucket = requireEnv("S3_BUCKET");
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const params = new URLSearchParams({ "list-type": "2", prefix });
    if (token) params.set("continuation-token", token);
    const listUrl = `${endpoint}/${bucket}?${params.toString()}`;

    const res = await awsClient().fetch(listUrl, { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`R2 list failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const xml = await res.text();
    for (const m of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
      keys.push(m[1]!);
    }
    const trunc = xml.match(/<IsTruncated>([^<]+)<\/IsTruncated>/);
    const next = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
    token = trunc?.[1] === "true" && next?.[1] ? next[1] : undefined;
  } while (token);

  return keys;
}
