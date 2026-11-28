/** Writes an order containing combo lines without the SQL order functions. */
import { db } from "./db";
import { shippingFor } from "./pricing";
import { num } from "./supabase";
import type { ResolvedLine } from "./order-lines";

type ComboOrderInput = {
  userId: number;
  orderNo: string;
  lines: ResolvedLine[];
  address: Record<string, unknown>;
  notes: string;
  paymentMethod: "cod" | "razorpay" | "whatsapp";
  paymentStatus: "pending" | "paid";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  discount?: number;
  color?: string;
  size?: string;
};

export async function createComboOrder(input: ComboOrderInput) {
  const subtotal = input.lines.reduce((sum, line) => sum + line.line_total, 0);
  const pincode = String(input.address?.pincode ?? "");
  const shipping = shippingFor(subtotal, pincode);
  const discount = Math.max(0, Number(input.discount) || 0);
  const total = Math.max(0, subtotal + shipping - discount);

  const inserted = await db().from("customer_orders").insert({
    order_no: input.orderNo,
    user_id: input.userId,
    status: "pending",
    subtotal,
    shipping,
    total,
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    razorpay_order_id: input.razorpayOrderId ?? null,
    razorpay_payment_id: input.razorpayPaymentId ?? "",
    contact_name: String(input.address?.fullName ?? ""),
    contact_phone: String(input.address?.phone ?? ""),
    address_line: [input.address?.line1, input.address?.line2].filter(Boolean).join(", "),
    city: String(input.address?.city ?? ""),
    state: String(input.address?.state ?? ""),
    pincode,
    notes: input.notes,
  });
  if (inserted.error) throw inserted.error;

  const { data: order } = await db()
    .from("customer_orders")
    .select("*")
    .eq("order_no", input.orderNo)
    .maybeSingle();
  const orderId = num((order as { id?: unknown } | null)?.id);

  for (const line of input.lines) {
    const itemError = await db().from("customer_order_items").insert({
      order_id: orderId,
      product_id: line.isCombo ? null : line.product_id,
      product_name: line.name,
      product_slug: line.slug,
      product_image: line.image,
      unit_price: line.unit_price,
      quantity: line.quantity,
      line_total: line.line_total,
      color: input.color ?? "",
      size: input.size ?? "",
    });
    if (itemError.error) throw itemError.error;
  }
  return { ...(order ?? {}), subtotal, shipping, total };
}
