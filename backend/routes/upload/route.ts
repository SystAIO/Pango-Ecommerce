import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import multer from "multer";
import { verifyToken } from "../../lib/auth";
import { uploadToR2, isR2Configured } from "../../lib/r2-store";
import { uploadToLocal, isLocalUploadConfigured } from "../../lib/local-store";
import { Router, type Request, type Response } from "express";

const router = Router();

// Memory storage: the file goes straight to R2/Cloudinary, never written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const cloudinaryReady = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_api_key" &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== "your_api_secret"
  );

async function handlePOST(req: Request, res: Response) {
  try {
    const token = req.cookies?.token;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const file = req.file as Express.Multer.File | undefined;
    const folder = (req.body?.folder as string) || "products";
    if (!file) return res.status(400).json({ error: "No file provided" });

    const buffer = file.buffer;

    // 1. Cloudflare R2 is the primary store when configured.
    if (isR2Configured()) {
      const result = await uploadToR2({
        buffer,
        contentType: file.mimetype || "image/jpeg",
        folder,
        filename: file.originalname || `image-${Date.now()}`,
      });
      return res.json({ url: result.url, key: result.key, storage: "r2" });
    }

    // 2. Cloudinary when R2 is absent but Cloudinary credentials exist.
    if (cloudinaryReady()) {
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "auto" },
          (error, result) => {
            if (error || !result) reject(error || new Error("Upload failed"));
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
      return res.json({
        url: uploadResult.secure_url || uploadResult.url,
        public_id: uploadResult.public_id,
        storage: "cloudinary",
      });
    }

    // 3. Local disk on the server (Apache serves the folder publicly).
    if (isLocalUploadConfigured()) {
      const result = await uploadToLocal({
        buffer,
        folder,
        filename: file.originalname || `image-${Date.now()}`,
      });
      return res.json({ url: result.url, key: result.key, storage: "local" });
    }

    // 4. Last resort for a fresh checkout with no storage configured.
    const mimeType = file.mimetype || "image/jpeg";
    return res.json({ url: `data:${mimeType};base64,${buffer.toString("base64")}`, storage: "data" });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return res.status(500).json({ error: error.message || "Failed to upload image" });
  }
}

router.post("/", upload.single("file"), handlePOST);

export default router;
