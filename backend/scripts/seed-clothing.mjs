/**
 * Replaces the live catalogue with the Pango Apparels winter line.
 *
 *   node --env-file=.env.local scripts/seed-clothing.mjs
 *
 * Deletes every electronics product (customer orders keep their denormalised
 * product snapshots; wishlist rows for deleted products cascade), inserts the
 * clothing catalogue from `scripts/clothing-catalogue.mjs`, then regenerates
 * `supabase/seed.sql` from the same data so a fresh install matches the DB.
 */

import { writeFileSync } from "node:fs";
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

const dealEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

const rows = CLOTHING.map((p) => ({
  name: p.name,
  slug: slugFor(p.name),
  category: p.category,
  brand: "Pango",
  price: p.price,
  mrp: p.mrp,
  image_url: p.image,
  images: p.images ?? [p.image],
  description_intro: `${p.name.replace(/^Pango\s*/, "")} — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.`,
  specifications: { "1. FABRIC & CARE": p.specs },
  badge: p.badge ?? "",
  rating: p.rating,
  review_count: p.reviews,
  stock: 25,
  is_featured: Boolean(p.featured),
  is_deal: Boolean(p.deal),
  deal_ends_at: p.deal ? dealEnds : null,
  bundle_slugs: p.bundles ?? [],
}));

// --sql-only: just regenerate supabase/seed.sql, leave the live database alone.
const sqlOnly = process.argv.includes("--sql-only");

// ─── 1. Replace the catalogue ──────────────────────────────────────────────
if (!sqlOnly) {
  console.log(`Deleting existing products…`);
  const { error: deleteError } = await db.from("products").delete().neq("id", 0);
  if (deleteError) {
    console.error("Delete failed:", deleteError.message);
    process.exit(1);
  }

  console.log(`Inserting ${rows.length} clothing products…`);
  const { error: insertError } = await db.from("products").insert(rows);
  if (insertError) {
    console.error("Insert failed:", insertError.message);
    process.exit(1);
  }

  const { count } = await db.from("products").select("id", { count: "exact", head: true });
  console.log(`Done. ${count} products in the database.`);
} else {
  console.log("--sql-only: skipped database changes; regenerating supabase/seed.sql…");
}

// ─── 2. Regenerate supabase/seed.sql from the same source ─────────────────
const esc = (s) => String(s).replace(/'/g, "''");
const values = rows
  .map(
    (r) => `(
  '${esc(r.name)}', '${esc(r.slug)}', '${esc(r.category)}', '${esc(r.brand)}',
  ${r.price}, ${r.mrp},
  '${esc(r.image_url)}', '${esc(JSON.stringify(r.images))}'::jsonb,
  '${esc(r.description_intro)}', '${esc(r.badge)}',
  ${r.rating}, ${r.review_count}, ${r.stock},
  ${r.is_featured}, ${r.is_deal}, ${r.is_deal ? "now() + interval '3 days'" : "null"},
  '${esc(JSON.stringify(r.bundle_slugs))}'::jsonb,
  '${esc(JSON.stringify(r.specifications))}'::jsonb
)`
  )
  .join(",\n");

const sql = `-- ─── Pango Apparels — winter clothing catalogue (GENERATED from scripts/clothing-catalogue.mjs) ───
-- Apply by pasting into the Supabase SQL Editor. DELETES every existing product first.
-- Safe to re-run.

begin;

delete from public.products;

insert into public.products (
  name, slug, category, brand, price, mrp,
  image_url, images, description_intro, badge,
  rating, review_count, stock, is_featured, is_deal, deal_ends_at,
  bundle_slugs, specifications
)
values
${values};

commit;
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql, "utf8");
console.log("supabase/seed.sql regenerated.");
