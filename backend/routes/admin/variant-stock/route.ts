import { Router, type Request, type Response } from "express";
import { getSessionUser } from "../../../lib/auth";
import { getVariantStock, setVariantStock, type VariantStockRow } from "../../../lib/variant-stock";

const router = Router();

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/** GET /api/admin/variant-stock?key=... — variant quantities for one item. */
router.get("/", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const key = String(req.query.key ?? "").trim();
  if (!key) return res.status(400).json({ error: "A stock key is required" });
  res.json({ key, variants: getVariantStock(key) });
});

/** PUT /api/admin/variant-stock — replace variant quantities for one item. */
router.put("/", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const key = String(req.body?.key ?? "").trim();
  const raw = req.body?.variants;
  if (!key || !Array.isArray(raw)) {
    return res.status(400).json({ error: "A stock key and variants list are required" });
  }
  const seen = new Set<string>();
  const variants: VariantStockRow[] = [];
  for (const entry of raw) {
    const row = (entry ?? {}) as Record<string, unknown>;
    const color = String(row.color ?? "").trim().slice(0, 80);
    const size = String(row.size ?? "").trim().slice(0, 40);
    if (!color && !size) continue;
    const id = `${color}::${size}`;
    if (seen.has(id)) continue;
    seen.add(id);
    variants.push({ color, size, quantity: Math.max(0, Math.floor(Number(row.quantity) || 0)) });
  }
  res.json({ success: true, key, variants: setVariantStock(key, variants) });
});

export default router;
