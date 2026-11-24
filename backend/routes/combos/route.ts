import { Router, type Request, type Response } from "express";
import { getSessionUser } from "../../lib/auth";
import { DEFAULT_COMBO_DATA, mergeComboData } from "../../lib/combo-data";
import { readComboData, writeComboData } from "../../lib/combo-store";

const router = Router();

/** GET /api/combos — public storefront data. */
router.get("/", (_req: Request, res: Response) => {
  res.json(mergeComboData(readComboData() ?? DEFAULT_COMBO_DATA));
});

/** PUT /api/combos — admin only. */
router.put("/", async (req: Request, res: Response) => {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const merged = mergeComboData(req.body);
  writeComboData(merged);
  res.json({ success: true, data: merged });
});

export default router;
