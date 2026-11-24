import { Router, type Request, type Response } from "express";
import { getSessionUser } from "../../lib/auth";
import { DEFAULT_CATALOG_CONFIG, mergeCatalogConfig } from "../../lib/catalog-config";
import { readLocalCatalogConfig, writeLocalCatalogConfig } from "../../lib/catalog-store";

const router = Router();

/** GET /api/catalog-config — public: the listing page needs it to render. */
router.get("/", (_req: Request, res: Response) => {
  res.json(mergeCatalogConfig(readLocalCatalogConfig() ?? DEFAULT_CATALOG_CONFIG));
});

/** PUT /api/catalog-config — admin only. */
router.put("/", async (req: Request, res: Response) => {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const merged = mergeCatalogConfig(req.body);
  writeLocalCatalogConfig(merged);
  res.json({ success: true, config: merged });
});

export default router;
