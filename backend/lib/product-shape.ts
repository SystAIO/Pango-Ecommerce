/**
 * The `Product` shape and how a database row becomes one.
 *
 * Deliberately separate from `lib/products.ts`, which imports the Supabase
 * service-role client. The mapping here is pure — no database, no secrets — so it
 * can be used from scripts, tests and any future client component without
 * dragging `server-only` along. `lib/products.ts` re-exports it, so importing
 * from either module gives the same types.
 */

import { json, num } from "./supabase";

export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  mrp: number;
  image_url: string | null;
  images: string[];
  description_intro: string;
  specifications: Record<string, string>;
  badge: string;
  rating: number;
  review_count: number;
  stock: number;
  inStock: boolean;
  discount: number | null;
  is_featured: boolean;
  is_deal: boolean;
  deal_ends_at: string | null;
  bundle_slugs: string[];
  /** Set per product in Admin → Product Management; overrides the global coupons. */
  coupon: ProductCoupon | null;
  created_at: string;
};

/** A raw PostgREST row. Loose because jsonb/numeric come back wider than the product. */
export type ProductRow = Record<string, unknown>;

/** Coupon fields, identical in shape to combo/collection/global coupons. */
export type ProductCoupon = {
  code: string;
  label: string;
  description: string;
  minOrder: number;
  value: number;
  kind: "flat" | "percent";
  active: boolean;
};

/** Reserved spec section: coupons live in the existing jsonb column, no migration needed. */
export const PRODUCT_COUPON_KEY = "PRODUCT COUPON";

export function normaliseProductCoupon(value: unknown): ProductCoupon | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const coupon = value as Record<string, unknown>;
  const code = String(coupon.code ?? "").trim().toUpperCase().slice(0, 40);
  const amount = Number(coupon.value) || 0;
  if (!code || amount <= 0) return null;
  return {
    code,
    label: String(coupon.label ?? "").trim().slice(0, 120) || `${code} off`,
    description: String(coupon.description ?? "").trim().slice(0, 250),
    minOrder: Math.max(0, Number(coupon.minOrder) || 0),
    value: amount,
    kind: coupon.kind === "percent" ? "percent" : "flat",
    active: coupon.active === true || coupon.active === "true",
  };
}

/**
 * Normalises a database row into the shape the UI renders.
 *
 * A product priced at 0 is a "priced on request" listing: it shows up in the
 * catalogue but cannot be added to a cart, so `inStock` is false for it too.
 */
export function toProduct(row: ProductRow): Product {
  const price = num(row.price);
  const mrp = num(row.mrp);
  const stock = num(row.stock);

  // The coupon is stored as a reserved spec section so it survives the
  // existing POST/PUT payload without a schema migration. Strip it from the
  // visible specifications table before rendering.
  const specifications = { ...json<Record<string, string>>(row.specifications, {}) };
  const couponEntry = Object.entries(specifications).find(
    ([title]) => title.toLowerCase() === PRODUCT_COUPON_KEY.toLowerCase()
  );
  const coupon = couponEntry ? normaliseProductCoupon(couponEntry[1]) : null;
  if (couponEntry) delete specifications[couponEntry[0]];

  return {
    id: num(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    category: String(row.category ?? "General"),
    brand: String(row.brand ?? ""),
    price,
    // Guard against a bad edit leaving mrp below price: a struck-through price
    // that is lower than the selling price looks broken.
    mrp: mrp > price ? mrp : 0,
    image_url: (row.image_url as string) ?? null,
    images: json<string[]>(row.images, []),
    description_intro: String(row.description_intro ?? ""),
    specifications,
    badge: String(row.badge ?? ""),
    rating: num(row.rating),
    review_count: num(row.review_count),
    stock,
    inStock: price > 0 && stock > 0,
    discount: mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : null,
    is_featured: Boolean(row.is_featured),
    is_deal: Boolean(row.is_deal),
    deal_ends_at: (row.deal_ends_at as string) ?? null,
    bundle_slugs: json<string[]>(row.bundle_slugs, []),
    coupon,
    created_at: String(row.created_at ?? ""),
  };
}

/** Maps a row set. */
export function toProducts(rows: ProductRow[] | null): Product[] {
  return (rows ?? []).map(toProduct);
}