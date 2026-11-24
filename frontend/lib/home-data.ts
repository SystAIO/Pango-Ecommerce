/**
 * Home page data loading.
 *
 * The homepage is a Server Component; the data it renders is assembled by the
 * backend (`GET /api/home`), which talks to Supabase. This module is a thin
 * HTTP client for that endpoint. If the backend is unreachable the page still
 * renders with empty sections and a notice, instead of crashing.
 *
 * `BACKEND_URL` defaults to the local dev backend. Browser-side `/api/*` calls
 * are proxied to the same service via a rewrite in `next.config.ts`.
 */

import type { Product } from "./product-shape";
import type { Bundle } from "./bundles";
import type { ComboData } from "./combo-data";
import { DEFAULT_COMBO_DATA } from "./combo-data";
import { DEFAULT_COLLECTIONS, type CollectionData } from "./collection-data";
import { DEFAULT_SECTIONS, mergeSections, type HomeSections } from "./homepage-content";

export type HomeSource = "database" | "fallback";

export type HomeData = {
  products: Product[];
  /** Products for the hero carousel, one per slide. */
  heroProducts: Product[];
  /** Departments for the strip under the hero, biggest first. */
  categories: { category: string; count: number }[];
  /** Everything with `is_deal`, soonest deadline first. */
  deals: Product[];
  /** Best sellers: top rated, then most reviewed. */
  bestSellers: Product[];
  /** New arrivals, most recently added first. */
  newArrivals: Product[];
  /** Products grouped by category, biggest category first. */
  byCategory: { category: string; products: Product[]; inCategoryCount: number }[];
  /** Configured "Frequently Bought Together" bundles. */
  bundles: Bundle[];
  /** Discount % for the hero ribbon, or null when nothing is on offer. */
  topDiscount: number | null;
  source: HomeSource;
  /** Populated when the data came from the fallback, so the page can explain itself. */
  notice: string | null;
};

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const EMPTY: HomeData = {
  products: [],
  heroProducts: [],
  categories: [],
  deals: [],
  bestSellers: [],
  newArrivals: [],
  byCategory: [],
  bundles: [],
  topDiscount: null,
  source: "fallback",
  notice: "Could not reach the store server — please try again in a moment.",
};

/**
 * Loads everything the homepage renders.
 *
 * Never throws. On any failure (backend down, bad response) the page renders
 * with empty sections and a notice rather than crashing.
 */
export async function loadHomeData(): Promise<HomeData> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/home`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`GET /api/home responded ${res.status}`);
      return EMPTY;
    }
    return (await res.json()) as HomeData;
  } catch (error) {
    console.error("loadHomeData failed:", error);
    return EMPTY;
  }
}

/**
 * Loads the admin-editable homepage sections (merged over the built-in
 * defaults by the backend). Falls back to the defaults when the backend is
 * unreachable — the page still renders a complete homepage.
 */
export async function loadHomeSections(): Promise<HomeSections> {
  try {
    // No cache: an admin toggle or reorder must disappear from the storefront
    // on the very next request, not up to 60 seconds later.
    const res = await fetch(`${BACKEND_URL}/api/homepage-sections`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`GET /api/homepage-sections responded ${res.status}`);
      return structuredClone(DEFAULT_SECTIONS);
    }
    // Re-merge over the defaults so a partial or stale payload (older row,
    // legacy keys) can never leave the page rendering an undefined section.
    const data = (await res.json()) as Record<string, unknown>;
    return mergeSections(data && typeof data === "object" ? data : {});
  } catch (error) {
    console.error("loadHomeSections failed:", error);
    return structuredClone(DEFAULT_SECTIONS);
  }
}

/** Loads the combo catalogue for the homepage COMBOS rail. Never throws. */
export async function loadCombos(): Promise<ComboData> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/combos`, { cache: "no-store" });
    if (!res.ok) return DEFAULT_COMBO_DATA;
    return (await res.json()) as ComboData;
  } catch {
    return DEFAULT_COMBO_DATA;
  }
}

/** Loads an admin-managed collection for the homepage rails. Never throws. */
export async function loadCollection(key: "new-arrivals" | "winterwear"): Promise<CollectionData> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/collections/${key}`, { cache: "no-store" });
    if (!res.ok) return DEFAULT_COLLECTIONS[key];
    return (await res.json()) as CollectionData;
  } catch {
    return DEFAULT_COLLECTIONS[key];
  }
}
