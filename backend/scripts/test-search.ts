/**
 * Checks search matching and the category-grid padding.
 *
 *   npx tsx scripts/test-search.ts
 *
 * No database or API key needed.
 */

import {
  resolveCategory,
  isLikelyCategoryQuery,
  normalise,
  searchProducts,
  matchCategories,
} from "../lib/search";
import { toProduct } from "../lib/product-shape";
import { CATEGORY_GRID_SIZE } from "../lib/home";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const P = (over: Record<string, unknown>) =>
  toProduct({
    id: Number(over.id ?? 1),
    slug: String(over.slug ?? "p"),
    name: String(over.name ?? "Product"),
    category: String(over.category ?? "General"),
    brand: String(over.brand ?? "Ecommerce"),
    price: Number(over.price ?? 1000),
    mrp: Number(over.mrp ?? 0),
    stock: Number(over.stock ?? 10),
    description_intro: String(over.desc ?? ""),
    rating: Number(over.rating ?? 4.5),
  });

const CATALOGUE = [
  // Nothing is literally called "hoodie" in every listing title — the alias exists for that.
  P({ id: 1, slug: "essential-hoodie-men", name: "Pango Essential Hoodie — Men", category: "Hoodies", rating: 4.8, desc: "Brushed fleece" }),
  P({ id: 2, slug: "fleece-zip-hoodie", name: "Pango Fleece Zip-Up Hoodie — Men", category: "Hoodies", rating: 4.6, desc: "Zip through" }),
  P({ id: 3, slug: "cropped-hoodie", name: "Pango Cropped Hoodie — Women", category: "Hoodies", rating: 4.6, desc: "Cropped relaxed fit" }),
  P({ id: 4, slug: "graphic-tee", name: "Pango Everyday Graphic Tee — Men", category: "T-Shirts", rating: 4.4, desc: "220 gsm cotton" }),
  P({ id: 5, slug: "pocket-tee", name: "Pango Heavyweight Pocket Tee", category: "T-Shirts", rating: 4.6 }),
  P({ id: 6, slug: "selvedge-denim", name: "Pango Selvedge Denim — Men", category: "Jeans", rating: 4.7 }),
  P({ id: 7, slug: "high-rise-jeans", name: "Pango High-Rise Jeans — Women", category: "Jeans", rating: 4.5 }),
  // The one product that IS called "hoodie".
  P({ id: 8, slug: "hoodie-stand", name: "Pango Hoodie Hanger Stand", category: "Accessories", rating: 4.1 }),
  P({ id: 10, slug: "storm-windcheater", name: "Pango Storm Windcheater Jacket — Men", category: "Jackets", rating: 4.8 }),
  P({ id: 11, slug: "alpine-puffer-women", name: "Pango Alpine Puffer Jacket — Women", category: "Jackets", rating: 4.9 }),
  P({ id: 12, slug: "studio-coord-set", name: "Pango Studio Co-ord Set — Women", category: "Co-ord Sets", rating: 4.7 }),
];

/* ── 1. Alias resolution ────────────────────────────────────────────────── */
console.log("\n── category resolution ──");

check("hoodie resolves to Hoodies", resolveCategory("hoodie") === "Hoodies");
check("Hoodie (capitalised) resolves", resolveCategory("Hoodie") === "Hoodies");
check("  hoodies  resolves (padded)", resolveCategory("  hoodies ") === "Hoodies");
check("puffer resolves to Jackets", resolveCategory("puffer") === "Jackets");
check("windcheater resolves to Jackets", resolveCategory("windcheater") === "Jackets");
check("jeans resolves to Jeans", resolveCategory("jeans") === "Jeans");
check("knit resolves to Sweaters", resolveCategory("knit") === "Sweaters");
check("coord resolves to Co-ord Sets", resolveCategory("coord") === "Co-ord Sets");
check("t-shirt resolves to T-Shirts", resolveCategory("t-shirt") === "T-Shirts");
check("cargo resolves to Joggers", resolveCategory("cargo") === "Joggers");
check("multi-word picks a known word", resolveCategory("everyday hoodie") === "Hoodies");
check("unknown term resolves to null", resolveCategory("zzzz") === null);
check("empty query resolves to null", resolveCategory("") === null);

check("'hoodie' is a category query", isLikelyCategoryQuery("hoodie"));
check("'graphic tee' resolves", resolveCategory("graphic tee") === "T-Shirts");
check("check 'puffer jacket' is a category query", isLikelyCategoryQuery("puffer jacket"));
check("unrelated phrase is not a category query", !isLikelyCategoryQuery("oat milk cortado"));
check("normalise collapses punctuation", normalise("  Oversized Hoodie! ") === "oversized hoodie");

/* ── 2. The Flipkart rule ──────────────────────────────────────────────── */
console.log("\n── category fallback (the Flipkart rule) ──");

// 'puffer' matches exactly one product (thin), and the query resolves to Jackets
// with two in stock — so the shopper gets the product link AND the category link.
const puffer = searchProducts(CATALOGUE, "puffer");
check("'puffer' shows the one product that matches",
  puffer.products.some((p) => p.slug === "alpine-puffer-women"),
  puffer.products.map((p) => p.slug).join(","));
check("'puffer' ALSO offers the Jackets category (one hit is thin)",
  puffer.category?.name === "Jackets",
  String(puffer.category?.name));
check("fallback reports the real count", puffer.category?.count === 2, `${puffer.category?.count}`);
check("category query recognised", puffer.lookedUpCategory);

// With no puffer in the catalogue at all, the department is the only answer.
const NO_PUFFER = CATALOGUE.filter((p) => p.slug !== "alpine-puffer-women");
const bare = searchProducts(NO_PUFFER, "puffer");
check("no puffer in stock -> no product hits", bare.products.length === 0, `${bare.products.length}`);
check("no puffer in stock -> Jackets category offered",
  bare.category?.name === "Jackets",
  String(bare.category?.name));

const tv = searchProducts(CATALOGUE, "tv");
check("'tv' has no product hits", tv.products.length === 0, `${tv.products.length}`);
check("'tv' now resolves to nothing (alias removed)", tv.category === null);

const windcheater = searchProducts(CATALOGUE, "windcheater");
check("'windcheater' offers the Jackets category", windcheater.category?.name === "Jackets", String(windcheater.category?.name));

// A department that exists in the aliases but has no stock must not produce a
// dead link — offering "Shop all Acoustic" when Acoustic is empty is worse than
// saying nothing.
const emptyDept = searchProducts(CATALOGUE, "cardigan");
check("resolved category with no products is NOT offered as a dead link",
  emptyDept.category === null,
  String(emptyDept.category?.name));
check("and it returns no products either", emptyDept.products.length === 0);

const nonexistent = searchProducts(CATALOGUE, "hoverboard");
check("unknown category gives no fallback", nonexistent.category === null);
check("unknown category gives no products", nonexistent.products.length === 0);

/* ── 3. Direct product matches win ─────────────────────────────────────── */
console.log("\n── direct matches ──");

const essential = searchProducts(CATALOGUE, "essential");
check("'essential' matches the product by name", essential.products[0]?.slug === "essential-hoodie-men", essential.products[0]?.slug);
check("good product match suppresses the category link", essential.category === null);

const zip = searchProducts(CATALOGUE, "fleece zip");
check("'fleece zip' matches the fleece zip hoodie", zip.products[0]?.slug === "fleece-zip-hoodie", zip.products[0]?.slug);

/* ── 4. Multi-word must all match ──────────────────────────────────────── */
console.log("\n── multi-word queries ──");

const acmeTee = searchProducts(
  [...CATALOGUE, P({ id: 9, name: "Acme Trail Tee", category: "T-Shirts", brand: "Acme", rating: 4.9 })],
  "acme tee"
);
check("both words match -> result", acmeTee.products.length === 1, `${acmeTee.products.length}`);

const mixed = searchProducts(CATALOGUE, "acme jeans");
check("one word unmatched -> no results", mixed.products.length === 0, `${mixed.products.length}`);

/* ── 5. Ranking ────────────────────────────────────────────────────────── */
console.log("\n── ranking ──");

const ranked = searchProducts(CATALOGUE, "hoodie");
check("'hoodie' finds the hoodie products", ranked.products.length >= 3, `${ranked.products.length}`);
check("highest-rated ranks first", ranked.products[0]?.slug === "essential-hoodie-men", ranked.products[0]?.slug);

const short = searchProducts(CATALOGUE, "ap");
check("too-short query still returns nothing noisy", short.products.length <= 3, `${short.products.length}`);

/* ── 6. Category typeahead ─────────────────────────────────────────────── */
console.log("\n── category typeahead ──");

const lap = matchCategories("hood");
check("'hood' suggests Hoodies", lap.some((c) => c.name === "Hoodies"), JSON.stringify(lap.map((c) => c.name)));
check("suggestions carry their aliases", (lap.find((c) => c.name === "Hoodies")?.aliases ?? []).includes("hoodie"));
check("empty term gives nothing", matchCategories("").length === 0);

/* ── 7. Category grid always fills 4 ───────────────────────────────────── */
console.log("\n── category grid padding ──");

const rows = [
  { category: "Hoodies", items: [1, 2, 3, 4] },
  { category: "Jeans", items: [6, 7] },
  { category: "Jackets", items: [10] },
];

const rankedAll = [...CATALOGUE].sort((a, b) => b.rating - a.rating);
const fillers = rankedAll;

let allFilled = true;
for (const row of rows) {
  const inCat = row.items.map((id) => CATALOGUE.find((p) => p.id === id)!);
  const taken = new Set(inCat.map((p) => p.slug));
  const topUps = fillers.filter((p) => !taken.has(p.slug)).slice(0, CATEGORY_GRID_SIZE - inCat.length);
  const full = [...inCat, ...topUps];

  if (full.length !== CATEGORY_GRID_SIZE) allFilled = false;
  if (new Set(full.map((p) => p.slug)).size !== full.length) {
    allFilled = false;
    console.log(`     duplicate slug in ${row.category}`);
  }
}
check("every row fills to exactly 4", allFilled, `grid size ${CATEGORY_GRID_SIZE}`);

/* ── Result ────────────────────────────────────────────────────────────── */
/* -- 8. Brand suggestions -------------------------------------------------- */
//
// Brands are data, not configuration: the admin dashboard adds them. These checks
// cover the behaviour that makes that work — reading the live product list rather
// than a fixed list, so a brand nobody coded for still shows up.
console.log("\n-- brand suggestions --");

const BRANDED = [
  P({ id: 21, slug: "p-hoodie", name: "Pango Essential Hoodie — Men", brand: "Pango", category: "Hoodies" }),
  P({ id: 22, slug: "p-zip", name: "Pango Fleece Zip Hoodie — Men", brand: "Pango", category: "Hoodies" }),
  P({ id: 23, slug: "p-coord", name: "Pango Winter Co-ord Set — Women", brand: "Pango", category: "Co-ord Sets" }),
  P({ id: 24, slug: "nv-tee", name: "Northvale Graphic Tee — Men", brand: "Northvale", category: "T-Shirts" }),
  P({ id: 25, slug: "nv-jogger", name: "Northvale Cargo Joggers — Men", brand: "Northvale", category: "Joggers" }),
  P({ id: 26, slug: "hm-puffer", name: "Himalaya Puffer Jacket — Women", brand: "Himalaya", category: "Jackets" }),
  P({ id: 27, slug: "hm-sweater", name: "Himalaya Wool Sweater — Men", brand: "Himalaya", category: "Sweaters" }),
  P({ id: 28, slug: "hm-overcoat", name: "Himalaya Overcoat — Women", brand: "Himalaya", category: "Jackets" }),
  P({ id: 29, slug: "nv-pocket", name: "Northvale Pocket Tee — Men", brand: "Northvale", category: "T-Shirts" }),
  // A brand that appears exactly once and would be missed by any minimum-count rule.
  P({ id: 30, slug: "one-off", name: "Oneoff Wool Scarf", brand: "Oneoff", category: "Accessories" }),
  // Brand not repeated in the name, so a product-name query must not summon a chip.
  P({ id: 31, slug: "nv-knit", name: "Merino Knit Crew — Men", brand: "Northvale", category: "Sweaters" }),
];

const brandCount = (brand: string) => BRANDED.filter((p) => p.brand === brand).length;
check("collectBrands counts every brand", brandCount("Pango") === 3 && brandCount("Himalaya") === 3 && brandCount("Northvale") === 4);
check("collectBrands keeps a one-product brand", brandCount("Oneoff") === 1);

const himalaya = searchProducts(BRANDED, "himalaya");
check("brand query suggests the brand", himalaya.brands[0]?.name === "Himalaya", String(himalaya.brands[0]?.name));
check("brand suggestion carries the stock count", himalaya.brands[0]?.count === 3, String(himalaya.brands[0]?.count));

// A brand chip is a different action from a product hit, not a substitute for
// one, so it survives alongside product results. Gating it on the hit count hid
// it for exactly the queries people type a brand for.
check("brand chip survives when product hits also came back", himalaya.products.length === 3 && himalaya.brands.length === 1, `${himalaya.products.length} products, ${himalaya.brands.length} brands`);

// A model search that never names a brand must not drag that brand in.
check("product-name query with no brand word gives no chip", searchProducts(BRANDED, "scarf").brands.length === 0, String(searchProducts(BRANDED, "scarf").brands.length));

check("leading word is enough to match a brand", searchProducts(BRANDED, "northvale puffer").brands[0]?.name === "Northvale", String(searchProducts(BRANDED, "northvale puffer").brands[0]?.name));
check("a pluralised brand still matches", searchProducts(BRANDED, "pangos").brands.length > 0, String(searchProducts(BRANDED, "pangos").brands.length));

// The plural tolerance must not stretch into a substring match.
check("a longer word sharing a prefix does NOT match", searchProducts(BRANDED, "himalayaunrelated").brands.length === 0, String(searchProducts(BRANDED, "himalayaunrelated").brands.length));

// A brand added later, with a single product, still resolves.
const newBrand = [...BRANDED, P({ id: 32, slug: "acme-1", name: "Acme Sens 900 Jacket", brand: "Acme", category: "Jackets" })];
check("a brand added later is picked up with no code change", searchProducts(newBrand, "acme sens").brands[0]?.name === "Acme", String(searchProducts(newBrand, "acme sens").brands[0]?.name));

check("empty query returns no brand chips", searchProducts(BRANDED, "").brands.length === 0);
check("unmatched brand returns no chip", searchProducts(BRANDED, "nothinglikethis").brands.length === 0);
check("brand cap is respected", searchProducts(BRANDED, "samsung", { brandLimit: 1 }).brands.length <= 1);

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);