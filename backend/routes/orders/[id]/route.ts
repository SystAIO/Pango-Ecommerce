import { db } from "../../../lib/db";
import { getSessionUser } from "../../../lib/auth";
import { describeError, num } from "../../../lib/supabase";
import { applyCancellation } from "../../../lib/cancel-flow";
import { Router, type Request, type Response } from "express";

const router = Router();

/** Statuses a customer is allowed to move an order to themselves. */
const CUSTOMER_CANCELLABLE = new Set(["pending", "processing"]);

/** GET /api/orders/[id] â€” a single order, scoped to its owner. */
async function handleGET(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const id = req.params.id;

  try {
    const orderResult = await db()
      .from("customer_orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.id)
      .maybeSingle();

    if (orderResult.error) throw orderResult.error;

    const order = orderResult.data;
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const itemsResult = await db()
      .from("customer_order_items")
      .select("*")
      .eq("order_id", num(id))
      .order("id", { ascending: true });

    if (itemsResult.error) throw itemsResult.error;

    return res.json({
      order: {
        ...order,
        subtotal: num(order.subtotal),
        shipping: num(order.shipping),
        total: num(order.total),
        items: (itemsResult.data ?? []).map((item) => ({
          ...item,
          unit_price: num(item.unit_price),
          line_total: num(item.line_total),
        })),
      },
    });
  } catch (error) {
    console.error(`GET /api/orders/${id} error:`, describeError(error));
    return res.status(500).json({ error: "Could not load order" });
  }
}

/**
 * PATCH /api/orders/[id] â€” cancel an order.
 *
 * A customer may only cancel while the order is still pending or processing; once it has
 * shipped the request is refused so the customer contacts support instead.
 */
async function handlePATCH(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const id = req.params.id;
  let body: { action?: string };
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  if (body.action !== "cancel") {
    return res.status(400).json({ error: "Unsupported action" });
  }

  try {
    const existing = await db()
      .from("customer_orders")
      .select("id, order_no, user_id, status, total, payment_method, payment_status, contact_name, contact_phone")
      .eq("id", id)
      .eq("user_id", session.id)
      .maybeSingle();

    if (existing.error) throw existing.error;
    if (!existing.data) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!CUSTOMER_CANCELLABLE.has(existing.data.status)) {
      return res.status(409).json({
          error: `An order that is already ${existing.data.status} cannot be cancelled online.`,
        });
    }

    // Scoped by user_id as well as id, so the check above and the write cannot
    // disagree about which order is being cancelled.
    const { error } = await db()
      .from("customer_orders")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", session.id);

    if (error) throw error;

    const { data: lines } = await db()
      .from("customer_order_items")
      .select("product_id, product_name, unit_price, quantity")
      .eq("order_id", id);
    await applyCancellation(
      { ...existing.data, items: lines ?? [] },
      "Cancelled by customer",
      "customer"
    );

    return res.json({ success: true, status: "cancelled" });
  } catch (error) {
    console.error(`PATCH /api/orders/${id} error:`, describeError(error));
    return res.status(500).json({ error: "Could not cancel order" });
  }
}

router.get("/:id", handleGET);
router.patch("/:id", handlePATCH);

export default router;
