/**
 * Resolves cart lines from trusted server data. Combos are merchandising
 * entries in .data/combos.json with synthetic ids (900000 + index); they are
 * not rows in `products`, so they need their own price lookup.
 */
import { readComboData } from "./combo-store";
import { num } from "./supabase";

export type ResolvedLine = {
  product_id: number;
  name: string;
  slug: string;
  image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  isCombo: boolean;
};

export const isComboId = (id: number) => id >= 900000;

/** Returns null when any id cannot be priced from the server's data. */
export function resolveOrderLines(
  wanted: Map<number, number>,
  productRows: Array<Record<string, unknown>>
): ResolvedLine[] | null {
  const byId = new Map(productRows.map((row) => [num(row.id), row]));
  const comboData = readComboData() as { combos?: unknown[] } | null;
  const combos = comboData?.combos ?? [];
  const lines: ResolvedLine[] = [];

  for (const [id, quantity] of wanted) {
    if (isComboId(id)) {
      const combo = combos[id - 900000] as
        | { name: string; slug: string; image: string; price: number }
        | undefined;
      if (!combo) return null;
      const price = num(combo.price);
      lines.push({
        product_id: id,
        name: String(combo.name),
        slug: String(combo.slug),
        image: combo.image || null,
        unit_price: price,
        quantity,
        line_total: price * quantity,
        isCombo: true,
      });
    } else {
      const row = byId.get(id);
      if (!row) return null;
      const price = num(row.price);
      lines.push({
        product_id: id,
        name: String(row.name ?? ""),
        slug: String(row.slug ?? ""),
        image: (row.image_url as string) || null,
        unit_price: price,
        quantity,
        line_total: price * quantity,
        isCombo: false,
      });
    }
  }
  return lines;
}
