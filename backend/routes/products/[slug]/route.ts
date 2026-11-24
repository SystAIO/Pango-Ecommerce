import { verifyToken } from "../../../lib/auth";
import { deleteProduct, getProductBySlug, toProductInput, updateProduct } from "../../../lib/products";
import { describeError } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

/** GET /api/products/[slug] â€” a single product. */
async function handleGET(req: Request, res: Response) {
  const slug = req.params.slug;

  try {
    const product = await getProductBySlug(slug);
    if (!product) return res.status(404).json({ error: "Not found" });
    return res.json({ product });
  } catch (error) {
    console.error(`GET /api/products/${slug} error:`, describeError(error));
    return res.status(500).json({ error: "Could not load product" });
  }
}

/** DELETE /api/products/[slug] â€” admin only. */
async function handleDELETE(req: Request, res: Response) {
  const token = req.cookies?.token;
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || decoded.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const slug = req.params.slug;
  try {
    await deleteProduct(slug);
    return res.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/products/${slug} error:`, describeError(error));
    return res.status(500).json({ error: "Could not delete product" });
  }
}

/** PUT /api/products/[slug] â€” admin only. */
async function handlePUT(req: Request, res: Response) {
  const token = req.cookies?.token;
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || decoded.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const slug = req.params.slug;
  try {
    const input = toProductInput(req.body);
    if (!input.name || !input.slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }

    await updateProduct(slug, input);
    return res.json({ success: true });
  } catch (error) {
    const message = describeError(error);
    console.error(`PUT /api/products/${slug} error:`, message);
    if (message.includes("23505")) {
      return res.status(409).json({ error: "That slug is already in use" });
    }
    return res.status(500).json({ error: "Could not update product" });
  }
}

router.get("/:slug", handleGET);
router.delete("/:slug", handleDELETE);
router.put("/:slug", handlePUT);

export default router;
