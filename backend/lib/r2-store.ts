/**
 * Cloudflare R2 image storage (S3-compatible).
 *
 * R2 is used when R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and
 * R2_BUCKET are configured. R2_PUBLIC_URL is the public base URL for the bucket
 * (a custom domain or the r2.dev URL). Uploads never leave the server — the
 * service-role credentials stay in backend/.env.
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type R2Config = {
  client: S3Client;
  bucket: string;
  publicBase: string;
};

let cached: R2Config | null | undefined;

const clean = (v: string | undefined) => {
  const s = String(v ?? "").trim();
  return s && !s.startsWith("your_") && !s.includes("example") ? s : "";
};

export function getR2Config(): R2Config | null {
  if (cached !== undefined) return cached;

  const accountId = clean(process.env.R2_ACCOUNT_ID);
  const accessKeyId = clean(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY);
  const bucket = clean(process.env.R2_BUCKET);
  const publicBase = clean(process.env.R2_PUBLIC_URL).replace(/\/+$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    cached = null;
    return cached;
  }

  cached = {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
    publicBase,
  };
  return cached;
}

export const isR2Configured = () => Boolean(getR2Config());

/** Uploads a buffer to R2 and returns its public URL. */
export async function uploadToR2(params: {
  buffer: Buffer;
  contentType: string;
  folder: string;
  filename: string;
}): Promise<{ url: string; key: string }> {
  const config = getR2Config();
  if (!config) throw new Error("Cloudflare R2 is not configured");

  // Keep object keys tidy and collision-free without exposing the original name.
  const safeName = params.filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  const key = `${params.folder.replace(/[^a-z0-9/_\-]/gi, "")}/${Date.now()}-${safeName}`;

  await config.client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { url: `${config.publicBase}/${key}`, key };
}
