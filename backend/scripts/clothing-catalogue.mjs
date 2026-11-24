/**
 * Pango Apparels — winter clothing catalogue (the data behind the storefront).
 *
 * Used by `scripts/seed-clothing.mjs`, which replaces `public.products` with
 * exactly these rows and regenerates `supabase/seed.sql` from the same source,
 * so the database and the repo seed can never drift apart.
 *
 * Winter line: hoodies, jackets, tees, denim, knitwear and co-ord sets.
 * Images are stock photographs from Unsplash — placeholder artwork, not photos
 * of the physical garments. Replace with real product shots via the admin
 * dashboard when available.
 */

const img = (id) =>
  `https://images.unsplash.com/photo-${id}?w=900&auto=format&fit=crop&q=80`;

const IMG = {
  hoodie1: img("1523398002811-999ca8dec234"),
  hoodie2: img("1556821840-3a63f95609a7"),
  tee1: img("1521572163474-6864f9cf17ab"),
  tee2: img("1576566588028-4147f3842f27"),
  jeans1: img("1542272604-787c3835535d"),
  jeans2: img("1541099649105-f69ad21f3246"),
  woman1: img("1445205170230-053b83016050"),
  woman2: img("1509631179647-0177331693ae"),
  womanCoat: img("1539109136881-3be0616acf4b"),
  womanTee: img("1556905055-8f358a7a47b2"),
  rack: img("1489987707025-afc232f7ea0f"),
  shop: img("1558769132-cb1aea458c5e"),
  rackMen: img("1434389677669-e08b4cac3105"),
  formal: img("1551028719-00167b16eac5"),
  manShirt: img("1571945153237-4929e783af4a"),
  teeMockup: img("1618354691373-d851c5c3a990"),
  womanDress: img("1544441893-675973e31985"),
  womanUrban: img("1509631179647-0177331693ae"),
  womanWinter: img("1539533018447-63fcce2678e3"),
  womanKnit: img("1620012253295-c15cc3e65df4"),
  womanCoatStreet: img("1539533018447-63fcce2678e3"),
};

export function slugFor(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

const HOUSE = "Pango";

/**
 * `deal` marks the Deal of the Day candidates — exactly 10 carry is_deal, which
 * fills the two 5-card rows on the homepage. `dealEndsInHours` is relative to
 * when the seed runs.
 */
export const CLOTHING = [
  /* ─── MEN'S ─── */
  { name: "Pango Essential Oversized Hoodie — Men", category: "Hoodies", price: 1499, mrp: 2499, badge: "Best Seller", rating: 4.7, reviews: 2140, featured: true, deal: true, image: IMG.hoodie1, specs: { Gender: "Men", Fabric: "400 gsm brushed fleece", Fit: "Oversized, drop shoulder", Care: "Cold wash inside out, line dry" }, bundles: ["pango-heavyweight-pocket-tee-men", "pango-selvedge-denim-men"], images: [IMG.hoodie1, IMG.hoodie2, IMG.rack, IMG.shop] },
  { name: "Pango Fleece Zip-Up Hoodie — Men", category: "Hoodies", price: 1899, mrp: 3299, badge: "Featured", rating: 4.6, reviews: 1180, featured: true, image: IMG.hoodie2, specs: { Gender: "Men", Fabric: "380 gsm zip fleece", Fit: "Relaxed", Care: "Cold wash, low heat tumble" }, images: [IMG.hoodie2, IMG.hoodie1, IMG.rack, IMG.shop] },
  { name: "Pango Everyday Graphic Tee — Men", category: "T-Shirts", price: 599, mrp: 999, badge: "Popular", rating: 4.4, reviews: 3210, deal: true, image: IMG.tee1, specs: { Gender: "Men", Fabric: "220 gsm combed cotton", Fit: "Regular", Care: "Machine wash cold" }, bundles: ["pango-relaxed-cargo-joggers-men"], images: [IMG.tee1, IMG.tee2, IMG.manShirt, IMG.rack] },
  { name: "Pango Heavyweight Pocket Tee — Men", category: "T-Shirts", price: 749, mrp: 1299, badge: "", rating: 4.6, reviews: 1875, image: IMG.tee2, specs: { Gender: "Men", Fabric: "240 gsm heavyweight cotton", Fit: "Regular", Care: "Machine wash cold" }, images: [IMG.tee2, IMG.tee1, IMG.rack, IMG.shop] },
  { name: "Pango Essential Tee — Multipack (3) — Men", category: "T-Shirts", price: 1499, mrp: 2499, badge: "Popular", rating: 4.6, reviews: 2650, featured: true, deal: true, image: IMG.tee2, specs: { Gender: "Men", Fabric: "220 gsm combed cotton", Fit: "Regular", Care: "Machine wash cold" }, images: [IMG.tee1, IMG.tee2, IMG.rack, IMG.teeMockup] },
  { name: "Pango Classic Crew Sweatshirt — Men", category: "Sweatshirts", price: 1299, mrp: 2199, badge: "Popular", rating: 4.5, reviews: 1640, deal: true, image: IMG.rack, specs: { Gender: "Men", Fabric: "350 gsm loopback cotton", Fit: "Relaxed", Care: "Cold wash, line dry" }, bundles: ["pango-everyday-trackpants-men"], images: [IMG.rack, IMG.hoodie1, IMG.tee1, IMG.shop] },
  { name: "Pango Half-Zip Sweatshirt — Men", category: "Sweatshirts", price: 1599, mrp: 2599, badge: "", rating: 4.6, reviews: 1430, image: IMG.rack, specs: { Gender: "Men", Fabric: "380 gsm brushed fleece", Fit: "Regular", Care: "Cold wash, line dry" }, images: [IMG.rack, IMG.hoodie2, IMG.tee2, IMG.shop] },
  { name: "Pango Storm Windcheater Jacket — Men", category: "Jackets", price: 2499, mrp: 4499, badge: "Best Seller", rating: 4.8, reviews: 930, featured: true, deal: true, image: IMG.shop, specs: { Gender: "Men", Fabric: "Ripstop polyester, DWR coating", Fit: "Regular water-resistant", Care: "Wipe clean or cold gentle wash" }, bundles: ["pango-essential-oversized-hoodie-men"], images: [IMG.shop, IMG.rackMen, IMG.jeans2, IMG.hoodie1] },
  { name: "Pango Alpine Puffer Jacket — Men", category: "Jackets", price: 4999, mrp: 8999, badge: "Premium", rating: 4.9, reviews: 640, featured: true, image: IMG.shop, specs: { Gender: "Men", Fabric: "Quilted nylon, 80 gsm fill", Fit: "Relaxed", Care: "Spot clean only" }, bundles: ["pango-wool-blend-sweater-men"], images: [IMG.shop, IMG.womanWinter, IMG.hoodie2, IMG.jeans1] },
  { name: "Pango Wool-Blend Sweater — Men", category: "Sweaters", price: 1899, mrp: 3499, badge: "Featured", rating: 4.7, reviews: 720, deal: true, image: IMG.woman1, specs: { Gender: "Men", Fabric: "60% wool, 40% acrylic", Fit: "Regular", Care: "Hand wash cold, dry flat" }, images: [IMG.rack, IMG.tee2, IMG.hoodie1, IMG.shop] },
  { name: "Pango Selvedge Denim — Men", category: "Jeans", price: 1999, mrp: 3499, badge: "Best Seller", rating: 4.7, reviews: 2760, featured: true, deal: true, image: IMG.jeans1, specs: { Gender: "Men", Fabric: "13.5 oz selvedge denim", Fit: "Slim straight", Care: "Wash inside out, cold" }, images: [IMG.jeans1, IMG.jeans2, IMG.rack, IMG.shop] },
  { name: "Pango Relaxed Cargo Joggers — Men", category: "Joggers", price: 1399, mrp: 2299, badge: "", rating: 4.5, reviews: 1520, image: IMG.jeans2, specs: { Gender: "Men", Fabric: "280 gsm cotton canvas", Fit: "Relaxed ankle-elastic", Care: "Machine wash cold" }, images: [IMG.jeans2, IMG.jeans1, IMG.shop, IMG.rack] },
  { name: "Pango Everyday Trackpants — Men", category: "Trackpants", price: 999, mrp: 1699, badge: "", rating: 4.3, reviews: 1180, image: IMG.jeans2, specs: { Gender: "Men", Fabric: "320 gsm loopback cotton", Fit: "Relaxed", Care: "Machine wash cold" }, images: [IMG.jeans2, IMG.jeans1, IMG.shop, IMG.rack] },
  { name: "Pango Oxford Casual Shirt — Men", category: "Shirts", price: 1199, mrp: 1999, badge: "Featured", rating: 4.5, reviews: 940, featured: true, image: IMG.tee1, specs: { Gender: "Men", Fabric: "100% cotton oxford", Fit: "Regular", Care: "Machine wash warm" }, images: [IMG.formal, IMG.manShirt, IMG.tee1, IMG.rack] },
  { name: "Pango Plaid Overshirt — Men", category: "Shirts", price: 1499, mrp: 2599, badge: "New", rating: 4.7, reviews: 690, image: IMG.tee2, specs: { Gender: "Men", Fabric: "Cotton flannel", Fit: "Relaxed", Care: "Cold wash, line dry" }, images: [IMG.tee2, IMG.rack, IMG.shop, IMG.jeans2] },
  { name: "Pango Slim Chinos — Men", category: "Trousers & Pants", price: 1699, mrp: 2799, badge: "", rating: 4.5, reviews: 1120, image: IMG.jeans1, specs: { Gender: "Men", Fabric: "Cotton twill", Fit: "Slim tapered", Care: "Machine wash cold" }, images: [IMG.jeans1, IMG.formal, IMG.jeans2, IMG.shop] },
  { name: "Pango Denim Trucker Jacket — Men", category: "Jackets", price: 2799, mrp: 4799, badge: "Best Seller", rating: 4.7, reviews: 860, image: IMG.jeans2, specs: { Gender: "Men", Fabric: "12 oz denim", Fit: "Classic trucker", Care: "Wash inside out, cold" }, images: [IMG.jeans2, IMG.jeans1, IMG.shop, IMG.rack] },

  /* ─── WOMEN'S ─── */
  { name: "Pango Boyfriend Tee — Women", category: "T-Shirts", price: 599, mrp: 999, badge: "Popular", rating: 4.6, reviews: 2440, deal: true, image: IMG.womanTee, specs: { Gender: "Women", Fabric: "220 gsm combed cotton", Fit: "Oversized boyfriend", Care: "Machine wash cold" }, images: [IMG.womanTee, IMG.womanDress, IMG.womanUrban, IMG.rack] },
  { name: "Pango Essential Hoodie — Women", category: "Hoodies", price: 1499, mrp: 2499, badge: "Best Seller", rating: 4.8, reviews: 2010, featured: true, deal: true, image: IMG.woman2, specs: { Gender: "Women", Fabric: "400 gsm brushed fleece", Fit: "Relaxed", Care: "Cold wash, line dry" }, bundles: ["pango-high-rise-jeans-women"], images: [IMG.woman2, IMG.womanTee, IMG.rack, IMG.shop] },
  { name: "Pango Cropped Hoodie — Women", category: "Hoodies", price: 1299, mrp: 2199, badge: "New", rating: 4.6, reviews: 870, image: IMG.womanTee, specs: { Gender: "Women", Fabric: "380 gsm brushed fleece", Fit: "Cropped relaxed", Care: "Cold wash, line dry" }, images: [IMG.womanTee, IMG.woman2, IMG.shop, IMG.rack] },
  { name: "Pango Alpine Puffer Jacket — Women", category: "Jackets", price: 3999, mrp: 7499, badge: "Premium", rating: 4.9, reviews: 580, featured: true, deal: true, image: IMG.womanCoat, specs: { Gender: "Women", Fabric: "Quilted nylon, 80 gsm fill", Fit: "Relaxed", Care: "Spot clean only" }, bundles: ["pango-knit-sweater-women"], images: [IMG.womanCoat, IMG.womanCoatStreet, IMG.woman1, IMG.shop] },
  { name: "Pango Windcheater — Women", category: "Jackets", price: 2299, mrp: 3999, badge: "", rating: 4.6, reviews: 760, image: IMG.woman1, specs: { Gender: "Women", Fabric: "Ripstop polyester, DWR coating", Fit: "Regular water-resistant", Care: "Wipe clean or cold gentle wash" }, images: [IMG.woman1, IMG.womanCoat, IMG.womanWinter, IMG.shop] },
  { name: "Pango Studio Co-ord Set — Women", category: "Co-ord Sets", price: 1799, mrp: 2999, badge: "Featured", rating: 4.7, reviews: 1320, featured: true, deal: true, image: IMG.woman2, specs: { Gender: "Women", Fabric: "Fleece top + knit bottom", Fit: "Relaxed co-ordinated", Care: "Cold wash, line dry" }, images: [IMG.woman2, IMG.woman1, IMG.womanTee, IMG.shop] },
  { name: "Pango Knit Sweater — Women", category: "Sweaters", price: 1699, mrp: 2999, badge: "", rating: 4.6, reviews: 890, image: IMG.woman1, specs: { Gender: "Women", Fabric: "Acrylic knit", Fit: "Relaxed", Care: "Hand wash cold, dry flat" }, images: [IMG.woman1, IMG.womanKnit, IMG.woman2, IMG.rack] },
  { name: "Pango High-Rise Jeans — Women", category: "Jeans", price: 1899, mrp: 3299, badge: "", rating: 4.5, reviews: 1740, image: IMG.woman2, specs: { Gender: "Women", Fabric: "11 oz stretch denim", Fit: "High-rise straight", Care: "Wash inside out, cold" }, images: [IMG.woman2, IMG.jeans2, IMG.jeans1, IMG.rack] },
  { name: "Pango Wide-Leg Trousers — Women", category: "Trousers & Pants", price: 1699, mrp: 2799, badge: "New", rating: 4.4, reviews: 980, image: IMG.womanCoat, specs: { Gender: "Women", Fabric: "Cotton twill", Fit: "Wide-leg high-rise", Care: "Machine wash cold" }, images: [IMG.womanCoat, IMG.woman1, IMG.woman2, IMG.rack] },
  { name: "Pango Wide Cargo Pants — Women", category: "Joggers", price: 1599, mrp: 2699, badge: "", rating: 4.5, reviews: 730, image: IMG.woman2, specs: { Gender: "Women", Fabric: "Cotton canvas", Fit: "Relaxed wide", Care: "Machine wash cold" }, images: [IMG.woman2, IMG.jeans2, IMG.woman1, IMG.shop] },
  { name: "Pango Oversized Shirt — Women", category: "Shirts", price: 1299, mrp: 2199, badge: "Popular", rating: 4.6, reviews: 1150, image: IMG.woman1, specs: { Gender: "Women", Fabric: "100% cotton poplin", Fit: "Oversized boyfriend", Care: "Machine wash warm" }, images: [IMG.woman1, IMG.womanTee, IMG.woman2, IMG.rack] },
  { name: "Pango Boyfriend Denim Jacket — Women", category: "Jackets", price: 2599, mrp: 4299, badge: "", rating: 4.6, reviews: 690, image: IMG.womanCoat, specs: { Gender: "Women", Fabric: "12 oz denim", Fit: "Relaxed boyfriend", Care: "Wash inside out, cold" }, images: [IMG.womanCoat, IMG.jeans2, IMG.woman2, IMG.shop] },
  { name: "Pango Winter Co-ord Set — Women", category: "Co-ord Sets", price: 2199, mrp: 3699, badge: "New", rating: 4.7, reviews: 520, image: IMG.womanTee, specs: { Gender: "Women", Fabric: "Sweatshirt + jogger twinset", Fit: "Relaxed co-ordinated", Care: "Cold wash, line dry" }, images: [IMG.womanTee, IMG.woman2, IMG.woman1, IMG.shop] },
];
