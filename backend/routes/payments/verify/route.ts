import { db } from "../../../lib/db";
import { getSessionUser } from "../../../lib/auth";
import { orderFunctionError } from "../../../lib/order-errors";
import {
  verifyRazorpaySignature,
  fetchRazorpayOrder,
  isValidRazorpayOrderId,
  isValidRazorpayPaymentId,
  isRazorpayConfigured,
} from "../../../lib/payments";
import { describeError, num } from "../../../lib/supabase";
import { computeTotals } from "../../../lib/pricing";
import {
  DEFAULT_REFERRAL_CONFIG,
  mergeReferralConfig,
  referralDiscount,
} from "../../../lib/referral-config";
import { readReferralConfig } from "../../../lib/referral-store";
import { resolveOrderLines } from "../../../lib/order-lines";
import { createComboOrder } from "../../../lib/combo-order";
import { saveOrderVariants } from "../../../lib/order-variants";
import { decrementStock } from "../../../lib/order-stock";
import { sendOrderConfirmation } from "../../../lib/email";
import { Router, type Request, type Response } from "express";

const router = Router();

/** Same shape as /api/orders. Kept local so a Razorpay order can be recognised as such. */
function generateOrderNo(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.floor(Math.random() * 46656)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return `OB-${stamp}${rand}`;
}

/**
 * POST /api/payments/verify — confirm a payment and record the order.
 *
 * Called from the Razorpay success handler. The HMAC signature check is what makes this
 * trustworthy: without it a caller could post any payment id and mark an order paid. The
 * customer order is written only after the signature verifies.
 */
async function handlePOST(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!isRazorpayConfigured()) {
    return res.status(503).json({ error: "Payments are not configured", code: "payments_not_configured" });
  }

  let body: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    items?: Array<{ productId?: number; quantity?: number; color?: string; size?: string }>;
    address?: Record<string, string>;
    notes?: string;
    referralCode?: string;
  };
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "Missing payment details" });
  }

  // Reject malformed ids up front, before the signature check and any database work.
  if (!isValidRazorpayOrderId(razorpayOrderId) || !isValidRazorpayPaymentId(razorpayPaymentId)) {
    return res.status(400).json({ error: "Invalid payment details" });
  }

  if (!verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
    return res.status(400).json({ error: "Payment verification failed. If you were charged, contact support." });
  }

  try {
    // Idempotency: Razorpay retries, and a double-tap must not create two orders.
    // `razorpay_order_id` is UNIQUE in Postgres, so even a concurrent double-insert
    // is rejected by the database rather than producing a duplicate order.
    const existing = await db()
      .from("customer_orders")
      .select("id, order_no, total, status, payment_status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (existing.error) throw existing.error;

    if (existing.data) {
      return res.json({
        success: true,
        alreadyRecorded: true,
        order: existing.data,
      });
    }

    // Independently confirm with Razorpay that the order was actually paid. The signature
    // proves the response came from Razorpay; this proves the payment succeeded.
    const remoteOrder = await fetchRazorpayOrder(razorpayOrderId);
    if (!remoteOrder) {
      return res.status(502).json({ error: "Could not confirm the payment with Razorpay" });
    }
    if (remoteOrder.status !== "paid" && !remoteOrder.paid) {
      return res.status(409).json({ error: `Payment is not complete (status: ${remoteOrder.status})` });
    }

    // ── Rebuild the order from database prices ───────────────────────────────
    const incoming = Array.isArray(body.items) ? body.items : [];
    if (incoming.length === 0) {
      return res.status(400).json({ error: "No items to record" });
    }

    const wanted = new Map<number, number>();
    for (const raw of incoming) {
      const productId = Number(raw.productId);
      if (!Number.isFinite(productId) || productId <= 0) continue;
      const quantity = Math.min(99, Math.max(1, Math.floor(Number(raw.quantity) || 1)));
      wanted.set(productId, Math.min(99, (wanted.get(productId) ?? 0) + quantity));
    }

    if (wanted.size === 0) {
      return res.status(400).json({ error: "No valid items to record" });
    }

    const chargedInPaise = num(remoteOrder.amount);
    const chargedInRupees = chargedInPaise / 100;

    // Old SQL functions price shipping on subtotal alone (₹499 / ₹25,000), so
    // recompute with the real rules and patch the stored order after the RPC.
    const { data: pricedRows } = await db()
      .from("products")
      .select("id, name, slug, price, image_url")
      .in("id", [...wanted.keys()]);
    const resolved = resolveOrderLines(wanted, pricedRows ?? []);
    if (!resolved) return res.status(409).json({ error: "One or more items are no longer available" });

    const totals = computeTotals(
      resolved.map((line) => ({ unit_price: line.unit_price, quantity: line.quantity })),
      (body.address as { pincode?: string } | undefined)?.pincode
    );
    const referral = mergeReferralConfig(readReferralConfig() ?? DEFAULT_REFERRAL_CONFIG);
    const discount = referralDiscount(referral, String(body.referralCode ?? ""), totals.subtotal);
    const finalTotal = Math.max(0, totals.total - discount);
    const orderNo = generateOrderNo();

    let order: unknown;
    if (resolved.some((line) => line.isCombo)) {
      // SQL order functions only know `products`; write combo orders directly.
      order = await createComboOrder({
        userId: session.id,
        orderNo,
        lines: resolved,
        address: body.address ?? {},
        notes: body.notes ?? "",
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        razorpayOrderId,
        razorpayPaymentId,
        discount,
        color: incoming[0]?.color,
        size: incoming[0]?.size,
      });
    } else {
      // `record_paid_order` compares its charged total to the bare subtotal.
      const rpc = await db().rpc("record_paid_order", {
        p_user_id: session.id,
        p_order_no: orderNo,
        p_items: [...wanted.entries()].map(([product_id, quantity]) => ({ product_id, quantity })),
        p_address: body.address ?? {},
        p_notes: body.notes ?? "",
        p_razorpay_order_id: razorpayOrderId,
        p_razorpay_payment_id: razorpayPaymentId,
        p_charged_total: totals.subtotal,
      });
      if (rpc.error) return orderFunctionError(res, rpc.error);
      order = rpc.data;

      // Store the authoritative shipping/total (the SQL function only knew the
      // subtotal) and make sure Razorpay charged exactly the same amount.
      await db()
        .from("customer_orders")
        .update({ shipping: totals.shipping, total: finalTotal })
        .eq("order_no", orderNo);
    }
    if (Math.abs(chargedInRupees - finalTotal) > 1) {
      console.error(`Payment amount mismatch for ${orderNo}: charged ${chargedInRupees}, expected ${finalTotal}`);
    }

    saveOrderVariants(
      orderNo,
      incoming.map((i) => ({
        productId: Number(i.productId),
        color: i.color,
        size: i.size,
      }))
    );

    // Online payment is the only path that consumes stock automatically.
    await decrementStock([...wanted.entries()].map(([product_id, quantity]) => ({ product_id, quantity })));

    const { data: buyer } = await db()
      .from("users")
      .select("email, name")
      .eq("id", session.id)
      .maybeSingle();
    await sendOrderConfirmation({
      to: String(buyer?.email ?? ""),
      name: String(buyer?.name ?? "Customer"),
      orderNo,
      total: finalTotal,
      lines: incoming.map((i) => ({ name: `Item #${i.productId}`, quantity: Number(i.quantity) || 1 })),
    }).catch(() => {});

    const { data: savedOrder } = await db()
      .from("customer_orders")
      .select("*")
      .eq("order_no", orderNo)
      .maybeSingle();
    return res.status(201).json({ success: true, order: savedOrder ?? order });
  } catch (error) {
    console.error("POST /api/payments/verify error:", describeError(error));
    return res.status(500).json({
        error:
          "Your payment succeeded but we could not record the order. Please contact support with your payment id.",
      });
  }
}

router.post("/", handlePOST);

export default router;
