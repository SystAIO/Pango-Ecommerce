/**
 * Single source of truth for the storefront catalogue taxonomy.
 *
 * The admin product form renders brand dropdowns from BRAND_GRID, so a brand
 * added here shows up without a code change. The storefront navbar's Men /
 * Women dropdowns are edited separately (Admin → Customize Navbar).
 *
 * Pango Apparels is a house-brand store today: every line is cut, stitched and
 * printed in-house, so every category carries the same four house brands.
 *
 * BRAND NAMES MUST MATCH `products.brand` EXACTLY. PostgREST `.eq()` is
 * case-sensitive; keep the two in step.
 */

export type BrandGrid = Record<string, string[]>;

const HOUSE_BRANDS = ["Pango", "Pango Essentials", "Pango Premium", "Pango Originals"];

/** Fallback brand list for navbar categories that have no entry in {@link BRAND_GRID}. */
export const DEFAULT_BRANDS = HOUSE_BRANDS;

export const BRAND_GRID: BrandGrid = {
  "T-Shirts": HOUSE_BRANDS,
  Shirts: HOUSE_BRANDS,
  Hoodies: HOUSE_BRANDS,
  Sweatshirts: HOUSE_BRANDS,
  Jackets: HOUSE_BRANDS,
  Sweaters: HOUSE_BRANDS,
  Jeans: HOUSE_BRANDS,
  Joggers: HOUSE_BRANDS,
  Trackpants: HOUSE_BRANDS,
  "Trousers & Pants": HOUSE_BRANDS,
  "Co-ord Sets": HOUSE_BRANDS,
};

/**
 * Legacy slot kept so `Admin-Dashboard/demo.tsx` (an unused prototype) still
 * compiles. Nothing in the live app reads it — the storefront navbar no longer
 * renders a "Buy Refurbished" panel.
 */
export const REFURBISHED_CATEGORIES: Record<
  string,
  { title: string; brands: string[] }
> = {};
