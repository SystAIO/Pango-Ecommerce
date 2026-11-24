/**
 * Pushes ONLY the images columns into the live catalogue, by slug.
 *
 *   node --env-file=.env.local scripts/update-clothing-images.mjs
 *
 * Targeted update so product ids — and the customer orders and wishlists that
 * reference them — are untouched. Run after editing `image` / `images` in
 * scripts/clothing-catalogue.mjs.
 */

import { createClient } from "@supabase/supabase-js";
import { CLOTHING, slugFor } from "./clothing-catalogue.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let updated = 0;
for (const p of CLOTHING) {
  const slug = slugFor(p.name);
  const { error } = await db
    .from("products")
    .update({ image_url: p.image, images: p.images ?? [p.image] })
    .eq("slug", slug);
  if (error) {
    console.error(`Failed on ${slug}:`, error.message);
    process.exitCode = 1;
    continue;
  }
  updated++;
}

console.log(`Updated images on ${updated}/${CLOTHING.length} products.`);
