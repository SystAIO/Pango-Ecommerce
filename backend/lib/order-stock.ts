/** Stock adjustments for paid orders and cancellations. */

import { db } from "./db";

export type StockLine = { product_id: number; quantity: number };

/** Paid orders consume stock. COD orders are handled manually by the admin. */
export async function decrementStock(lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    const id = Number(line.product_id);
    const qty = Math.max(0, Number(line.quantity) || 0);
    if (!Number.isFinite(id) || id <= 0 || qty === 0) continue;
    const { data } = await db().from("products").select("stock").eq("id", id).maybeSingle();
    if (!data) continue;
    const next = Math.max(0, (Number(data.stock) || 0) - qty);
    await db().from("products").update({ stock: next }).eq("id", id);
  }
}

/** Cancelling or returning a paid order puts the units back in stock. */
export async function restoreStock(lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    const id = Number(line.product_id);
    const qty = Math.max(0, Number(line.quantity) || 0);
    if (!Number.isFinite(id) || id <= 0 || qty === 0) continue;
    const { data } = await db().from("products").select("stock").eq("id", id).maybeSingle();
    if (!data) continue;
    const next = Math.max(0, (Number(data.stock) || 0) + qty);
    await db().from("products").update({ stock: next }).eq("id", id);
  }
}
