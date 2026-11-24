/**
 * Per-colour / per-size stock.
 *
 * One key per catalogue item: product:<id>, combo:<slug>, collection:<key>:<slug>.
 * Stored locally so the flow works before any SQL migration is applied.
 */

import fs from "node:fs";
import path from "node:path";

export type VariantStockRow = { color: string; size: string; quantity: number };

const FILE = path.join(process.cwd(), ".data", "variant-stock.json");

type Store = Record<string, VariantStockRow[]>;

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

export function getVariantStock(key: string): VariantStockRow[] {
  return read()[key] ?? [];
}

export function setVariantStock(key: string, rows: VariantStockRow[]): VariantStockRow[] {
  const store = read();
  store[key] = rows;
  write(store);
  return rows;
}

export function totalVariantStock(key: string): number {
  return getVariantStock(key).reduce((sum, r) => sum + Math.max(0, Number(r.quantity) || 0), 0);
}
