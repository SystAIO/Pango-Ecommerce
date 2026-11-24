import { Router, type Request, type Response } from "express";
import { db } from "../../../lib/db";
import { getSessionUser } from "../../../lib/auth";
import { describeError, num } from "../../../lib/supabase";
import { getVariantStock } from "../../../lib/variant-stock";
import { readComboData } from "../../../lib/combo-store";
import { DEFAULT_COMBO_DATA, mergeComboData } from "../../../lib/combo-data";
import { readCollection } from "../../../lib/collection-store";
import { COLLECTION_KEYS, DEFAULT_COLLECTIONS, mergeCollectionData } from "../../../lib/collection-data";

const router = Router();

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/** GET /api/admin/inventory — full catalogue stock plus sales totals per product. */
router.get("/", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const [{ data: products, error: productError }, { data: lines, error: lineError }] =
      await Promise.all([
        db()
          .from("products")
          .select("id, name, slug, category, brand, price, mrp, stock, image_url, badge, is_featured, created_at")
          .order("id", { ascending: false })
          .limit(500),
        db()
          .from("customer_order_items")
          .select("product_id, quantity, line_total")
          .limit(5000),
      ]);

    if (productError) {
      return res.status(500).json({ error: describeError(productError) });
    }
    if (lineError) {
      return res.status(500).json({ error: describeError(lineError) });
    }

    const sales = new Map<number, { units: number; revenue: number }>();
    for (const line of lines ?? []) {
      const id = Number(line.product_id);
      if (!Number.isFinite(id)) continue;
      const entry = sales.get(id) ?? { units: 0, revenue: 0 };
      entry.units += Math.max(0, Number(line.quantity) || 0);
      entry.revenue += num(line.line_total);
      sales.set(id, entry);
    }

    const productRows = (products ?? []).map((p) => {
      const baseStock = Math.max(0, Number(p.stock) || 0);
      const key = `product:${Number(p.id)}`;
      const variants = getVariantStock(key);
      const stock = variants.length > 0 ? variants.reduce((n, v) => n + Math.max(0, v.quantity), 0) : baseStock;
      const sold = sales.get(Number(p.id)) ?? { units: 0, revenue: 0 };
      return {
        key,
        source: "product" as const,
        sourceLabel: "Catalogue",
        id: Number(p.id),
        name: String(p.name ?? ""),
        slug: String(p.slug ?? ""),
        category: String(p.category ?? "General"),
        brand: String(p.brand ?? ""),
        price: num(p.price),
        mrp: num(p.mrp),
        stock,
        variants,
        image_url: (p.image_url as string) ?? null,
        badge: String(p.badge ?? ""),
        is_featured: Boolean(p.is_featured),
        created_at: String(p.created_at ?? ""),
        sold_units: sold.units,
        revenue: Math.round(sold.revenue * 100) / 100,
        stock_value: Math.round(stock * num(p.price) * 100) / 100,
      };
    });

    // Combo products and the managed collections are inventory items too.
    const comboData = mergeComboData(readComboData() ?? DEFAULT_COMBO_DATA);
    const comboRows = comboData.combos.map((c) => {
      const key = `combo:${c.id}`;
      const variants = getVariantStock(key);
      const stock = variants.reduce((n, v) => n + Math.max(0, v.quantity), 0);
      return {
        key,
        source: "combo" as const,
        sourceLabel: "Combos",
        id: 0,
        name: c.name,
        slug: c.slug,
        category: c.category,
        brand: c.brand,
        price: c.price,
        mrp: c.mrp,
        stock,
        variants,
        image_url: c.image || null,
        badge: c.badge,
        is_featured: false,
        created_at: "",
        sold_units: 0,
        revenue: 0,
        stock_value: Math.round(stock * c.price * 100) / 100,
      };
    });

    const collectionRows = COLLECTION_KEYS.flatMap((keyName) => {
      const data = mergeCollectionData(readCollection(keyName), keyName);
      return data.items.map((item) => {
        const key = `collection:${keyName}:${item.slug}`;
        const variants = getVariantStock(key);
        const stock = variants.reduce((n, v) => n + Math.max(0, v.quantity), 0);
        return {
          key,
          source: "collection" as const,
          sourceLabel: keyName === "winterwear" ? "Winterwear" : "New Arrivals",
          id: 0,
          name: item.name,
          slug: item.slug,
          category: item.category,
          brand: item.brand,
          price: item.price,
          mrp: item.mrp,
          stock,
          variants,
          image_url: item.image || null,
          badge: item.badge,
          is_featured: false,
          created_at: "",
          sold_units: 0,
          revenue: 0,
          stock_value: Math.round(stock * item.price * 100) / 100,
        };
      });
    });

    const rows = [...productRows, ...comboRows, ...collectionRows];

    const totalStock = rows.reduce((sum, r) => sum + r.stock, 0);
    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const totalSold = rows.reduce((sum, r) => sum + r.sold_units, 0);

    res.json({
      items: rows,
      summary: {
        products: rows.length,
        categories: new Set(rows.map((r) => r.category)).size,
        total_stock: totalStock,
        stock_value: Math.round(rows.reduce((sum, r) => sum + r.stock_value, 0) * 100) / 100,
        sold_units: totalSold,
        revenue: Math.round(totalRevenue * 100) / 100,
        low_stock: rows.filter((r) => r.stock > 0 && r.stock <= 10).length,
        out_of_stock: rows.filter((r) => r.stock === 0).length,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/inventory error:", describeError(error));
    res.status(500).json({ error: "Could not load inventory" });
  }
});

/** PATCH /api/admin/inventory/:id — adjust stock for one product. */
router.patch("/:id", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const id = Number(req.params.id);
  const stock = Number(req.body?.stock);
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(stock) || stock < 0) {
    return res.status(400).json({ error: "A valid product id and stock value are required" });
  }

  try {
    const { data, error } = await db()
      .from("products")
      .update({ stock: Math.floor(stock) })
      .eq("id", id)
      .select("id, name, stock")
      .maybeSingle();
    if (error) return res.status(500).json({ error: describeError(error) });
    if (!data) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, product: data });
  } catch (error) {
    console.error("PATCH /api/admin/inventory error:", describeError(error));
    res.status(500).json({ error: "Could not update stock" });
  }
});

export default router;
