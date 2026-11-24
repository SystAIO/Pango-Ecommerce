import { Router, type Request, type Response } from "express";
import { db } from "../../../lib/db";
import { getSessionUser } from "../../../lib/auth";
import { describeError, num } from "../../../lib/supabase";
import { getOrderVariants } from "../../../lib/order-variants";
import { applyCancellation } from "../../../lib/cancel-flow";

const router = Router();

const STATUSES = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/** GET /api/admin/orders — every customer's orders with items and selected variants. */
router.get("/", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const { data: orders, error } = await db()
      .from("customer_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) return res.status(500).json({ error: describeError(error) });

    const list = orders ?? [];
    const orderIds = list.map((o) => Number(o.id)).filter(Number.isFinite);
    const userIds = [...new Set(list.map((o) => Number(o.user_id)).filter(Number.isFinite))];

    const [itemsResult, usersResult] = await Promise.all([
      orderIds.length
        ? db().from("customer_order_items").select("*").in("order_id", orderIds).order("id", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? db().from("users").select("id, name, email").in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (itemsResult.error) return res.status(500).json({ error: describeError(itemsResult.error) });

    const itemsByOrder = new Map<number, any[]>();
    for (const item of itemsResult.data ?? []) {
      const orderId = Number(item.order_id);
      const arr = itemsByOrder.get(orderId) ?? [];
      arr.push(item);
      itemsByOrder.set(orderId, arr);
    }

    const usersById = new Map<number, { name: string; email: string }>();
    for (const u of usersResult.data ?? []) {
      usersById.set(Number(u.id), { name: String(u.name ?? ""), email: String(u.email ?? "") });
    }

    const enriched = list.map((order) => {
      const orderNo = String(order.order_no ?? "");
      const variants = getOrderVariants(orderNo);
      const items = (itemsByOrder.get(Number(order.id)) ?? []).map((item, index) => {
        const key = `${Number(item.product_id)}:${index}`;
        const variant = variants[key] ?? {};
        return {
          ...item,
          unit_price: num(item.unit_price),
          line_total: num(item.line_total),
          quantity: Number(item.quantity) || 0,
          color: variant.color ?? "",
          size: variant.size ?? "",
        };
      });

      return {
        id: Number(order.id),
        order_no: orderNo,
        status: String(order.status ?? "pending"),
        payment_method: String(order.payment_method ?? ""),
        payment_status: String(order.payment_status ?? ""),
        subtotal: num(order.subtotal),
        shipping: num(order.shipping),
        total: num(order.total),
        contact_name: String(order.contact_name ?? ""),
        contact_phone: String(order.contact_phone ?? ""),
        address_line: String(order.address_line ?? ""),
        city: String(order.city ?? ""),
        state: String(order.state ?? ""),
        pincode: String(order.pincode ?? ""),
        notes: String(order.notes ?? ""),
        created_at: String(order.created_at ?? ""),
        customer: usersById.get(Number(order.user_id)) ?? { name: "", email: "" },
        items,
      };
    });

    res.json({ orders: enriched });
  } catch (error) {
    console.error("GET /api/admin/orders error:", describeError(error));
    res.status(500).json({ error: "Could not load orders" });
  }
});

/** PATCH /api/admin/orders/:id — update fulfilment status. */
router.patch("/:id", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const id = Number(req.params.id);
  const status = String(req.body?.status ?? "");
  if (!Number.isFinite(id) || id <= 0 || !STATUSES.has(status)) {
    return res.status(400).json({ error: "A valid order id and status are required" });
  }

  try {
    const { data: before } = await db()
      .from("customer_orders")
      .select("id, order_no, user_id, total, payment_method, payment_status, contact_name, contact_phone, status")
      .eq("id", id)
      .maybeSingle();

    const { data, error } = await db()
      .from("customer_orders")
      .update({ status })
      .eq("id", id)
      .select("id, order_no, status")
      .maybeSingle();
    if (error) return res.status(500).json({ error: describeError(error) });
    if (!data) return res.status(404).json({ error: "Order not found" });

    // Cancelling a paid order restores stock and opens a refund record.
    if (status === "cancelled" && before && before.status !== "cancelled") {
      const { data: lines } = await db()
        .from("customer_order_items")
        .select("product_id, product_name, unit_price, quantity")
        .eq("order_id", id);
      await applyCancellation(
        { ...before, items: lines ?? [] },
        String(req.body?.reason ?? "Cancelled by admin"),
        "admin"
      );
    }

    res.json({ success: true, order: data });
  } catch (error) {
    console.error("PATCH /api/admin/orders error:", describeError(error));
    res.status(500).json({ error: "Could not update order" });
  }
});

export default router;
