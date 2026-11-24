/**
 * Refund & return records.
 *
 * A cancellation of a paid order (or a return requested by a customer) creates
 * a record here. Stock is restored when the refund is marked refunded, so the
 * inventory tab always reflects reality.
 */

import fs from "node:fs";
import path from "node:path";

export type RefundStatus = "pending" | "refunded" | "rejected";
export type RefundKind = "cancel" | "return";

export type RefundRecord = {
  id: number;
  orderId: number;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  kind: RefundKind;
  amount: number;
  paymentMethod: string;
  reason: string;
  status: RefundStatus;
  items: { productId: number; name: string; quantity: number; unitPrice: number; color?: string; size?: string }[];
  createdAt: string;
  updatedAt: string;
};

const FILE = path.join(process.cwd(), ".data", "refunds.json");

export function readRefunds(): RefundRecord[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as unknown;
    return Array.isArray(parsed) ? (parsed as RefundRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeRefunds(records: RefundRecord[]): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(records, null, 2), "utf8");
}

export function addRefund(record: Omit<RefundRecord, "id" | "createdAt" | "updatedAt">): RefundRecord {
  const records = readRefunds();
  const now = new Date().toISOString();
  const created: RefundRecord = {
    ...record,
    id: records.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1,
    createdAt: now,
    updatedAt: now,
  };
  writeRefunds([created, ...records]);
  return created;
}

export function updateRefund(id: number, patch: Partial<RefundRecord>): RefundRecord | null {
  const records = readRefunds();
  let updated: RefundRecord | null = null;
  const next = records.map((r) => {
    if (r.id !== id) return r;
    updated = { ...r, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (updated) writeRefunds(next);
  return updated;
}
