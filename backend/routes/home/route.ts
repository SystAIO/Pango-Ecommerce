import { loadHomeData } from "../../lib/home-data";
import { Router, type Request, type Response } from "express";

const router = Router();

/**
 * GET /api/home — everything the homepage renders, in one call.
 *
 * `loadHomeData()` never throws: a database problem degrades to the static
 * fallback catalogue with `source: "fallback"` and an explanatory `notice`.
 */
async function handleGET(_req: Request, res: Response) {
  const data = await loadHomeData();
  res.json(data);
}

router.get("/", handleGET);

export default router;
