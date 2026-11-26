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
  /** Primary colourway and sibling colours used by the "MORE COLORS" rail. */
  color: ProductColor | null;
  moreColors: ProductColor[];
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

/** A colourway: display name plus the hex code that links sibling products. */
export type ProductColor = { name: string; hex: string };

/** Reserved spec sections: colour data lives in the products jsonb column. */
export const PRODUCT_COLOR_KEY = "PRODUCT COLOR";
export const MORE_COLORS_KEY = "MORE COLORS";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Accepts #RRGGBB, #RGB and RRGGBB; always returns upper-case #RRGGBB. */
export function normaliseHex(value: unknown): string {
  const raw = String(value ?? "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toUpperCase()}`;
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toUpperCase();
  }
  return "";
}

export function normaliseProductColor(value: unknown): ProductColor | null {
  const colour = asRecord(value);
  if (!colour) return null;
  const hex = normaliseHex(colour.hex);
  if (!hex) return null;
  return { name: String(colour.name ?? "").trim().slice(0, 40) || hex, hex };
}

export function normaliseMoreColors(value: unknown): ProductColor[] {
  let raw: unknown[] = [];
  if (Array.isArray(value)) raw = value;
  else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) raw = parsed;
    } catch {
      raw = [];
    }
  }
  const seen = new Set<string>();
  const colours: ProductColor[] = [];
  for (const entry of raw.slice(0, 12)) {
    const colour = normaliseProductColor(entry);
    if (!colour || seen.has(colour.hex)) continue;
    seen.add(colour.hex);
    colours.push(colour);
  }
  return colours;
}

export function normaliseProductCoupon(value: unknown): ProductCoupon | null {
  const coupon = asRecord(value);
  if (!coupon) return null;
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

  const colourEntry = Object.entries(specifications).find(
    ([title]) => title.toLowerCase() === PRODUCT_COLOR_KEY.toLowerCase()
  );
  const moreColoursEntry = Object.entries(specifications).find(
    ([title]) => title.toLowerCase() === MORE_COLORS_KEY.toLowerCase()
  );
  const color = colourEntry ? normaliseProductColor(colourEntry[1]) : null;
  const moreColors = moreColoursEntry ? normaliseMoreColors(moreColoursEntry[1]) : [];
  if (colourEntry) delete specifications[colourEntry[0]];
  if (moreColoursEntry) delete specifications[moreColoursEntry[0]];

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
    color,
    moreColors,
    created_at: String(row.created_at ?? ""),
  };
}

/** Maps a row set. */
export function toProducts(rows: ProductRow[] | null): Product[] {
  return (rows ?? []).map(toProduct);
}

/**
 * Other colourways of the same product (Myntra's "MORE COLORS" strip).
 *
 * Products are separate catalogue rows. Two rows are treated as colourways of
 * one product when they are in the same category and either shares a hex code
 * with the other (the admin enters the sibling's hex in "More colours"), or
 * both carry the same primary hex. Matching is deliberately bidirectional.
 */
export function findMoreColorProducts(product: Product, products: Product[]): Product[] {
  const category = String(product.category ?? "").trim().toLowerCase();
  const own = [product.color?.hex, ...product.moreColors.map((c) => c.hex)]
    .filter((hex): hex is string => Boolean(hex))
    .map((hex) => hex.toUpperCase());
  if (!category || own.length === 0) return [];

  const ownSet = new Set(own);
  return products.filter((candidate) => {
    if (candidate.slug === product.slug) return false;
    if (String(candidate.category ?? "").trim().toLowerCase() !== category) return false;
    const hexes = [
      candidate.color?.hex,
      ...candidate.moreColors.map((c) => c.hex),
    ].filter((hex): hex is string => Boolean(hex)).map((hex) => hex.toUpperCase());
    return hexes.some((hex) => ownSet.has(hex));
  });
}