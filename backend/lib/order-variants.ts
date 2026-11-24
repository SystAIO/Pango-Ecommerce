/**
 * Per-line colour/size selected at checkout.
 *
 * The SQL order tables predate variant tracking, so the selections are kept in
 * a small local file keyed by order number. The admin order API merges them
 * into the persisted line items for both display and shipping labels.
 */

import fs from "node:fs";
import path from "node:path";

export type LineVariant = { color?: string; size?: string };

const FILE = path.join(process.cwd(), ".data", "order-variants.json");

type Store = Record<string, LineVariant>;

function read(): Store {
  try {
    if (!fs.existsSync(FILE)) return {};
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2), "utf8");
}

const key = (orderNo: string, productId: number, index: number) =>
  `${orderNo}::${productId}::${index}`;

/** Persists the variants submitted with one order. */
export function saveOrderVariants(
  orderNo: string,
  items: { productId: number; color?: string; size?: string }[]
): void {
  if (!orderNo) return;
  const store = read();
  items.forEach((item, index) => {
    if (!item.color && !item.size) return;
    store[key(orderNo, item.productId, index)] = {
      color: item.color?.slice(0, 120),
      size: item.size?.slice(0, 40),
    };
  });
  write(store);
}

/** Returns variants for an order, keyed by `${productId}:${index}`. */
export function getOrderVariants(orderNo: string): Record<string, LineVariant> {
  const store = read();
  const out: Record<string, LineVariant> = {};
  const prefix = `${orderNo}::`;
  for (const [k, value] of Object.entries(store)) {
    if (!k.startsWith(prefix)) continue;
    const rest = k.slice(prefix.length);
    out[rest.replace(/::/g, ":")] = value;
  }
  return out;
}
