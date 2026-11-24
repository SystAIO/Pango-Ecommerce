import { listProducts } from "../../lib/products";
import { searchProducts } from "../../lib/search";
import { describeError } from "../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

/**
 * GET /api/search?q=mobile — homepage and catalogue search.
 *
 * Public, read-only, and deliberately cheap: the catalogue is small enough to
 * filter in memory, which keeps the matching logic in one place (lib/search.ts)
 * and testable without a database.
 *
 * Returns both the product hits and, when the query names a department, the
 * category to fall back to — see lib/search.ts for why.
 */


const MIN_QUERY_LENGTH = 2;

async function handleGET(req: Request, res: Response) {
  const query = (new URL(req.url, "http://localhost").searchParams.get("q") ?? "").trim();

  if (query.length < MIN_QUERY_LENGTH) {
    return res.json({
      query,
      products: [],
      category: null,
      brands: [],
      lookedUpCategory: false,
      categoryTotal: 0,
    });
  }

  try {
    const products = await listProducts();
    const result = searchProducts(products, query, { limit: 8 });

    return res.json(result);
  } catch (error) {
    console.error("GET /api/search error:", describeError(error));
    return res.status(500).json({ error: "Search is unavailable right now" });
  }
}

router.get("/", handleGET);

export default router;
