/** Shared side-effects for cancelling an order: stock, refund record, email. */

import { db } from "./db";
import { addRefund } from "./refund-store";
import { restoreStock } from "./order-stock";
import { sendCancellationNotice } from "./email";

export async function applyCancellation(
  order: Record<string, any>,
  reason: string,
  source: "customer" | "admin"
): Promise<void> {
  const paid = String(order.payment_status ?? "") === "paid";
  const items = Array.isArray(order.items) ? order.items : [];

  // COD never decremented stock, so there is nothing to restore.
  if (paid && items.length > 0) {
    await restoreStock(
      items.map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) || 0 }))
    );
  }

  let email = "";
  let name = String(order.contact_name ?? "Customer");
  try {
    const { data } = await db()
      .from("users")
      .select("email, name")
      .eq("id", Number(order.user_id))
      .maybeSingle();
    if (data) {
      email = String(data.email ?? "");
      name = String(data.name ?? name);
    }
  } catch { /* email is best-effort */ }

  if (paid) {
    addRefund({
      orderId: Number(order.id),
      orderNo: String(order.order_no ?? ""),
      customerName: name,
      customerEmail: email,
      customerPhone: String(order.contact_phone ?? ""),
      kind: "cancel",
      amount: Number(order.total) || 0,
      paymentMethod: String(order.payment_method ?? ""),
      reason: reason || `Cancelled by ${source}`,
      status: "pending",
      items: items.map((i) => ({
        productId: Number(i.product_id),
        name: String(i.product_name ?? ""),
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unit_price) || 0,
        color: i.color,
        size: i.size,
      })),
    });
  }

  await sendCancellationNotice({
    to: email,
    name,
    orderNo: String(order.order_no ?? ""),
    reason,
    refunded: paid,
  });
}
