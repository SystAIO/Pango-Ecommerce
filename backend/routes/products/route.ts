import { verifyToken } from "../../lib/auth";
import { createProduct, listProducts, toProductInput } from "../../lib/products";
import { describeError } from "../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

/**
 * GET /api/products — the catalogue, newest first.
 *
 * Supports `?category=`, `?brand=`, `?search=`, `?gender=` and `?limit=`/`?offset=`.
 */
async function handleGET(req: Request, res: Response) {
  try {
    const { searchParams } = new URL(req.url, "http://localhost");
    const limitParam = Number(searchParams.get("limit"));
    const offsetParam = Number(searchParams.get("offset"));
    const genderParam = searchParams.get("gender");

    const products = await listProducts({
      category: searchParams.get("category") || undefined,
      brand: searchParams.get("brand") || undefined,
      search: searchParams.get("search") || undefined,
      gender: genderParam === "women" || genderParam === "men" ? genderParam : undefined,
      limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
      offset: Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : undefined,
    });

    return res.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", describeError(error));
    return res.status(500).json({ error: "Could not load products" });
  }
}

/** POST /api/products — admin only. */
async function handlePOST(req: Request, res: Response) {
  const token = req.cookies?.token;
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || decoded.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const input = toProductInput(req.body);
    if (!input.name || !input.slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }

    await createProduct(input);

    // The homepage is an ISR page; show the new product straight away.

    return res.status(201).json({ success: true });
  } catch (error) {
    // 23505 = unique_violation, i.e. the slug is already taken.
    const message = describeError(error);
    console.error("POST /api/products error:", message);
    if (message.includes("23505")) {
      return res.status(409).json({ error: "That slug is already in use" });
    }
    return res.status(500).json({ error: "Could not create product" });
  }
}

router.get("/", handleGET);
router.post("/", handlePOST);

export default router;
