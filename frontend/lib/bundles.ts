/**
 * "Frequently Bought Together" bundle type.
 *
 * The backend (../../backend/lib/bundles.ts) owns the data access; the frontend
 * only needs the shape to render the section. Keep this in sync with the
 * backend definition.
 */

import type { Product } from "./product-shape";

export type Bundle = {
  /** The product the customer is looking at. */
  hero: Product;
  /** What to buy alongside it, already resolved. */
  companions: Product[];
  /** Sum of every line at quantity 1. */
  total: number;
  /** How much the customer saves against the sum of the individual MRPs. */
  saving: number;
};
