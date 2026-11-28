/**
 * Product reads and writes.
 *
 * Every place in the app that needs products goes through here, so the messy part
 * of talking to Postgres lives in one file: `numeric` columns arrive as strings
 * over PostgREST, `jsonb` can arrive as an object or a string, and the derived
 * fields the UI needs (discount %, "in stock") are computed once rather than in
 * each route that happens to need them.
 *
 * This module imports the Supabase service-role client, so it is server-only. The
 * `Product` type and the row mapping live in `lib/product-shape.ts`, which has no
 * database dependency and can be imported anywhere.
 */

import { db } from "./db";
import { productGender } from "./gender";
import { asRow, asRows, json, num } from "./supabase";
import {
  normaliseMoreColors,
  normaliseProductColor,
  normaliseProductCoupon,
  MORE_COLORS_KEY,
  PRODUCT_COLOR_KEY,
  PRODUCT_COUPON_KEY,
  PURCHASE_COUNT_KEY,
  randomPurchaseCount,
  randomRating,
  toProduct,
  toProducts,
  type Product,
  type ProductRow,
} from "./product-shape";

export type { Product, ProductRow };
export { toProduct, toProducts };

/** Every product read selects the same columns — one place to add a new field. */
export const PRODUCT_COLUMNS =
  "id, name, slug, category, brand, price, mrp, image_url, images, description_intro, " +
  "specifications, badge, rating, review_count, stock, is_featured, is_deal, " +
  "deal_ends_at, bundle_slugs, created_at";

export type ProductQuery = {
  category?: string;
  brand?: string;
  search?: string;
  /** Gender lives in specifications/name — "Shop For Women" uses this. */
  gender?: "men" | "women";
  /** Cap the number of rows returned. */
  limit?: number;
  /** Skip this many rows (for infinite scroll / pagination). */
  offset?: number;
};

/** The catalogue, newest first, optionally filtered by category, brand or search term. */
export async function listProducts(options: ProductQuery = {}): Promise<Product[]> {
  let query = db()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false });

  if (options.category) query = query.eq("category", options.category);
  if (options.brand) query = query.eq("brand", options.brand);
  if (options.search) {
    // `*` makes the term a prefix match and ilike makes it case-insensitive.
    const term = `%${options.search.replace(/[%_,]/g, " ")}%`;
    query = query.or(`name.ilike.${term},brand.ilike.${term},category.ilike.${term}`);
  }
  // Gender is inferred from each product's specs/name, so it can only be
  // applied after the rows arrive. Skip SQL pagination in that case and slice
  // the filtered list instead, or the page size would truncate before filtering.
  if (!options.gender) {
    if (options.offset && options.offset > 0) {
      const from = options.offset;
      // PostgREST .range() is inclusive; use it instead of .limit() so offset+limit
      // don't fight each other.
      query = options.limit ? query.range(from, from + options.limit - 1) : query.range(from, from + 999);
    } else if (options.limit) {
      query = query.limit(options.limit);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  let products = toProducts(asRows<ProductRow>(data));
  if (options.gender) {
    products = products.filter((product) => productGender(product) === options.gender);
    const from = options.offset && options.offset > 0 ? options.offset : 0;
    products = options.limit ? products.slice(from, from + options.limit) : products.slice(from);
  }
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await db()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? toProduct(asRow<ProductRow>(data)) : null;
}

/** The distinct categories present in the catalogue, with a count of each. */
export async function listCategories(): Promise<{ category: string; count: number }[]> {
  const { data, error } = await db()
    .from("products")
    .select("category")
    .order("category");

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of asRows<Record<string, unknown>>(data)) {
    const category = String(row.category ?? "General");
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/** Fields accepted when creating or editing a product. */
export type ProductInput = {
  name: string;
  slug: string;
  category?: string;
  brand?: string;
  price?: number;
  mrp?: number;
  image_url?: string | null;
  images?: string[];
  description_intro?: string;
  specifications?: Record<string, unknown>;
  badge?: string;
  rating?: number;
  review_count?: number;
  stock?: number;
  is_featured?: boolean;
  is_deal?: boolean;
  deal_ends_at?: string | null;
  bundle_slugs?: string[];
};

/** Coerces a request body into a valid insert/update payload. */
export function toProductInput(body: Record<string, unknown>): ProductInput {
  // A product's own coupon is kept in a reserved spec section: the products
  // table already has a jsonb column for specifications, so no migration (and
  // no second API/store) is needed. Any stale reserved key is replaced.
  const reserved = new Set([
    PRODUCT_COUPON_KEY.toLowerCase(),
    PRODUCT_COLOR_KEY.toLowerCase(),
    MORE_COLORS_KEY.toLowerCase(),
    PURCHASE_COUNT_KEY.toLowerCase(),
  ]);
  const specifications: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(json<Record<string, unknown>>(body.specifications, {}))) {
    if (!reserved.has(key.toLowerCase())) specifications[key] = value;
  }
  const coupon = normaliseProductCoupon(body.coupon);
  if (coupon) {
    specifications[PRODUCT_COUPON_KEY] = {
      code: coupon.code,
      label: coupon.label,
      description: coupon.description,
      minOrder: String(coupon.minOrder),
      value: String(coupon.value),
      kind: coupon.kind,
      active: String(coupon.active),
    };
  }
  const color = normaliseProductColor(body.color);
  if (color) specifications[PRODUCT_COLOR_KEY] = { name: color.name, hex: color.hex };
  const moreColors = normaliseMoreColors(body.moreColors);
  if (moreColors.length) specifications[MORE_COLORS_KEY] = moreColors;
  const purchaseCount = num(body.purchaseCount, 0) || randomPurchaseCount();
  specifications[PURCHASE_COUNT_KEY] = String(purchaseCount);
  const rating = num(body.rating);
  const displayRating = rating > 4 ? rating : randomRating();

  return {
    name: String(body.name ?? "").trim(),
    slug: String(body.slug ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    category: String(body.category ?? "General").trim() || "General",
    brand: String(body.brand ?? "").trim(),
    price: num(body.price),
    mrp: num(body.mrp),
    image_url: body.image_url ? String(body.image_url) : null,
    images: Array.isArray(body.images) ? body.images.map(String) : [],
    description_intro: String(body.description_intro ?? ""),
    specifications,
    badge: String(body.badge ?? ""),
    rating: displayRating,
    review_count: num(body.review_count),
    stock: num(body.stock, 25),
    is_featured: Boolean(body.is_featured),
    is_deal: Boolean(body.is_deal),
    deal_ends_at: body.deal_ends_at ? String(body.deal_ends_at) : null,
    bundle_slugs: Array.isArray(body.bundle_slugs) ? body.bundle_slugs.map(String) : [],
  };
}

export async function createProduct(input: ProductInput): Promise<void> {
  const { error } = await db().from("products").insert(input);
  if (error) throw error;
}

export async function updateProduct(slug: string, input: ProductInput): Promise<void> {
  const { error } = await db()
    .from("products")
    .update(input)
    .eq("slug", slug);
  if (error) throw error;
}

export async function deleteProduct(slug: string): Promise<void> {
  const { error } = await db().from("products").delete().eq("slug", slug);
  if (error) throw error;
}