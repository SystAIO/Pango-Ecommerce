/**
 * Product ratings & reviews.
 *
 * Reviews with 3+ stars are published immediately; 1–2 star reviews are held
 * for admin approval. Local file persistence keeps the flow working before any
 * SQL migration is applied (schema.sql includes the matching table).
 */

import fs from "node:fs";
import path from "node:path";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: number;
  productId: number;
  productSlug: string;
  productName: string;
  productImage: string;
  userId: number;
  userName: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  helpfulUp: number;
  helpfulDown: number;
  createdAt: string;
};

const FILE = path.join(process.cwd(), ".data", "reviews.json");

const SEED: Review[] = [];

export function readReviews(): Review[] {
  try {
    if (!fs.existsSync(FILE)) return structuredClone(SEED);
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as unknown;
    return Array.isArray(parsed) ? (parsed as Review[]) : structuredClone(SEED);
  } catch {
    return structuredClone(SEED);
  }
}

export function writeReviews(reviews: Review[]): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(reviews, null, 2), "utf8");
}

export function nextReviewId(reviews: Review[]): number {
  return reviews.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
}

export function cleanReview(input: unknown): Omit<Review, "id" | "status" | "helpfulUp" | "helpfulDown" | "createdAt"> | null {
  const r = (input ?? {}) as Record<string, unknown>;
  const rating = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
  const text = String(r.text ?? "").trim().slice(0, 1200);
  const productSlug = String(r.productSlug ?? "").trim().slice(0, 200);
  const productName = String(r.productName ?? "").trim().slice(0, 200);
  if (!text || !productSlug) return null;
  return {
    productId: Math.max(0, Number(r.productId) || 0),
    productSlug,
    productName: productName || productSlug,
    productImage: String(r.productImage ?? "").trim().slice(0, 500),
    userId: Math.max(0, Number(r.userId) || 0),
    userName: String(r.userName ?? "Customer").trim().slice(0, 80) || "Customer",
    rating,
    text,
  };
}
