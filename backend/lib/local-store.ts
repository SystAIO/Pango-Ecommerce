/**
 * Local-disk image storage for servers without Cloudflare R2 / Cloudinary.
 *
 * Set LOCAL_UPLOAD_DIR to a folder Apache can serve and LOCAL_UPLOAD_URL to its
 * public URL. Files are written there and their public URL is returned, so no
 * base64 blobs end up in the database.
 */

import fs from "node:fs";
import path from "node:path";

const dir = () => String(process.env.LOCAL_UPLOAD_DIR ?? "").trim();
const baseUrl = () => String(process.env.LOCAL_UPLOAD_URL ?? "").trim().replace(/\/+$/, "");

export const isLocalUploadConfigured = () => Boolean(dir() && baseUrl());

export async function uploadToLocal(params: {
  buffer: Buffer;
  folder: string;
  filename: string;
}): Promise<{ url: string; key: string }> {
  if (!isLocalUploadConfigured()) throw new Error("Local upload is not configured");

  const safeFolder = params.folder.replace(/[^a-z0-9/_\-]/gi, "") || "general";
  const safeName = params.filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  const key = `${safeFolder}/${Date.now()}-${safeName}`;
  const target = path.join(dir(), key);

  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.writeFile(target, params.buffer);

  return { url: `${baseUrl()}/${key}`, key };
}
