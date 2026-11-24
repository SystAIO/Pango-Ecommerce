import { db } from "../../../lib/db";
import { getSessionUser } from "../../../lib/auth";
import { isRazorpayConfigured, getRazorpayCredentials, createRazorpayOrder, toPaise } from "../../../lib/payments";
import { validateAddress } from "../../../lib/validation";
import { computeTotals } from "../../../lib/pricing";
import { describeError, num } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

type IncomingItem = { productId?: number; slug?: string; quantity?: number };

/**
 * POST /api/payments/checkout — prepare a checkout.
 *
 * Resolves every product and its price from the database (never from the request body),
 * calculates shipping, and opens a Razorpay order for the resulting amount. Returns
 * everything the client needs to render the review step and open the Razorpay modal.
 *
 * This deliberately does NOT create a `customer_orders` row. The order is only recorded
 * once payment succeeds, in /api/payments/verify, so abandoned checkouts leave no junk.
 */
async function handlePOST(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!isRazorpayConfigured()) {
    return res.status(503).json({
        error:
          "Payments are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local.",
        code: "payments_not_configured",
      });
  }

  let body: {
    items?: IncomingItem[];
    addressId?: number;
    address?: Record<string, string>;
    notes?: string;
  };
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const incoming = Array.isArray(body.items) ? body.items : [];
  if (incoming.length === 0) {
    return res.status(400).json({ error: "Your cart is empty" });
  }
  if (incoming.length > 50) {
    return res.status(400).json({ error: "Too many items in one order" });
  }

  // A delivery address is mandatory before payment.
  let address = body.address;
  let addressId: number | null = null;

  try {
    if (body.addressId) {
      const stored = await db()
        .from("addresses")
        .select("*")
        .eq("id", body.addressId)
        .eq("user_id", session.id)
        .maybeSingle();

      if (stored.error) throw stored.error;
      if (!stored.data) {
        return res.status(404).json({ error: "Delivery address not found" });
      }

      addressId = num(stored.data.id);
      address = {
        fullName: stored.data.full_name,
        phone: stored.data.phone,
        line1: stored.data.line1,
        line2: stored.data.line2,
        city: stored.data.city,
        state: stored.data.state,
        pincode: stored.data.pincode,
      };
    }

    if (!address) {
      return res.status(400).json({ error: "A delivery address is required" });
    }

    const addressErrors = validateAddress(address as any);
    if (Object.keys(addressErrors).length > 0) {
      return res.status(400).json({ error: "Please fix the highlighted address fields", errors: addressErrors });
    }

    // Collapse duplicate lines and clamp quantities, mirroring /api/orders.
    const wanted = new Map<number, number>();
    for (const raw of incoming) {
      const productId = Number(raw.productId);
      if (!Number.isFinite(productId) || productId <= 0) continue;
      const quantity = Math.min(99, Math.max(1, Math.floor(Number(raw.quantity) || 1)));
      wanted.set(productId, Math.min(99, (wanted.get(productId) ?? 0) + quantity));
    }

    if (wanted.size === 0) {
      return res.status(400).json({ error: "No valid items in cart" });
    }

    const productIds = [...wanted.keys()];
    const productsResult = await db()
      .from("products")
      .select("id, name, slug, price, image_url")
      .in("id", productIds);

    if (productsResult.error) throw productsResult.error;

    const byId = new Map(
      (productsResult.data ?? []).map((product) => [num(product.id), product])
    );

    const missing = productIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      return res.status(409).json({ error: "One or more items are no longer available" });
    }

    const lines = productIds.map((productId) => {
      const product = byId.get(productId)!;
      const quantity = wanted.get(productId)!;
      const unitPrice = num(product.price);

      return {
        product_id: productId,
        name: product.name,
        slug: product.slug,
        image: product.image_url || null,
        unit_price: unitPrice,
        quantity,
        line_total: unitPrice * quantity,
      };
    });

    // A product priced at 0 is an "On Request" listing and cannot be paid for online.
    const unpayable = lines.find((line) => line.unit_price <= 0);
    if (unpayable) {
      return res.status(409).json({
          error: `"${unpayable.name}" is priced on request. Please contact us to order it.`,
          code: "on_request",
        });
    }

    const { subtotal, shipping, total } = computeTotals(
      lines.map((line) => ({ unit_price: line.unit_price, quantity: line.quantity }))
    );

    const { keyId } = getRazorpayCredentials();
    const receipt = `rcpt_${session.id}_${Date.now().toString(36)}`;

    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amountInPaise: toPaise(total),
        receipt,
        notes: { userId: String(session.id), addressId: addressId ? String(addressId) : "" },
      });
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      return res.status(502).json({ error: "Could not start the payment. Please try again." });
    }

    return res.json({
      keyId,
      razorpayOrderId: razorpayOrder.id,
      amount: toPaise(total),
      currency: "INR",
      receipt,
      items: lines,
      subtotal,
      shipping,
      total,
      address,
      addressId,
      notes: body.notes || "",
    });
  } catch (error) {
    console.error("POST /api/payments/checkout error:", describeError(error));
    return res.status(500).json({ error: "Could not start checkout" });
  }
}

router.post("/", handlePOST);

export default router;
