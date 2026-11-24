/**
 * Backfills `Gender` inside each product's specifications, inferred from the
 * product name ("— Men" / "— Women"). Rows with no marker are left untouched
 * — review and rename them rather than guess.
 *
 *   node --env-file=.env.local scripts/update-gender-spec.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await db.from("products").select("id, name, specifications");
if (error) {
  console.error("Could not read products:", error.message);
  process.exit(1);
}

let updated = 0;
for (const p of data ?? []) {
  const name = String(p.name ?? "");
  const gender = /women/i.test(name) ? "Women" : /\bmen\b/i.test(name) ? "Men" : null;
  if (!gender) continue; // no marker — needs a manual review, not a guess

  let specs = p.specifications;
  if (typeof specs === "string") {
    try {
      specs = JSON.parse(specs);
    } catch {
      specs = {};
    }
  }
  specs = specs && typeof specs === "object" ? { ...specs } : {};

  const sectionName = Object.keys(specs)[0] ?? "1. FABRIC & CARE";
  const section =
    specs[sectionName] && typeof specs[sectionName] === "object" ? { ...specs[sectionName] } : {};
  section.Gender = gender;
  specs[sectionName] = section;

  const { error: upError } = await db.from("products").update({ specifications: specs }).eq("id", p.id);
  if (upError) {
    console.error(`Failed on ${name}:`, upError.message);
    process.exitCode = 1;
    continue;
  }
  updated++;
}

console.log(`Backfilled Gender on ${updated}/${(data ?? []).length} products.`);
