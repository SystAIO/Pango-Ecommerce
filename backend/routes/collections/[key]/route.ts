import { Router, type Request, type Response } from "express";
import { getSessionUser } from "../../../lib/auth";
import { COLLECTION_KEYS, DEFAULT_COLLECTIONS, mergeCollectionData, type CollectionKey } from "../../../lib/collection-data";
import { readCollection, writeCollection } from "../../../lib/collection-store";

const router = Router();

function validKey(value: string): value is CollectionKey {
  return (COLLECTION_KEYS as string[]).includes(value);
}

/** GET /api/collections/:key — public storefront data. */
router.get("/:key", (req: Request, res: Response) => {
  const key = req.params.key;
  if (!validKey(key)) return res.status(404).json({ error: "Unknown collection" });
  res.json(mergeCollectionData(readCollection(key), key));
});

/** PUT /api/collections/:key — admin only. */
router.put("/:key", async (req: Request, res: Response) => {
  const key = req.params.key;
  if (!validKey(key)) return res.status(404).json({ error: "Unknown collection" });
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const merged = mergeCollectionData(req.body, key);
  writeCollection(key, merged);
  res.json({ success: true, data: merged });
});

export default router;
