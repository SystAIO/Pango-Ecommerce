/**
 * Home page content.
 *
 * The homepage is database-driven: `loadHomeData()` reads products and bundles
 * from Supabase so anything you add in the admin dashboard shows up immediately.
 *
 * This file holds the two things that are NOT in the database:
 *
 *   1. Static editorial content — the hero slides, solutions, services, testimonials.
 *      These are copy decisions, not records, and putting them in a table would
 *      mean an admin UI just to fix a typo.
 *
 *   2. `FALLBACK_CATALOGUE` — used only when Supabase is unreachable or still
 *      empty, so a fresh clone renders a real-looking storefront instead of an
 *      empty page. It mirrors `supabase/seed.sql`; once the database has data
 *      this is never read.
 *
 * The catalogue is winter clothing: hoodies, jackets, tees, denim, knitwear and
 * co-ord sets under the Pango Apparels house brand.
 */

import type { Product } from "./product-shape";
import { SITE } from "./site";

/**
 * Cards per category row on the homepage.
 *
 * Every row shows exactly this many. A category holding fewer is topped up with
 * best sellers from elsewhere, because rows of uneven length are what make a grid
 * look broken. Declared here rather than in `home-data.ts` because that module
 * imports the Supabase client, and this constant is needed by tests and by the
 * grid component.
 */
export const CATEGORY_GRID_SIZE = 4;

/* ──────────────────────────────────────────────────────────────────────────
   HERO
   ────────────────────────────────────────────────────────────────────────── */

export type HeroSlide = {
  eyebrow: string;
  title: string;
  /** Portion of `title` rendered in the accent colour. */
  accent: string;
  body: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  /** Tailwind gradient classes for the slide background. */
  gradient: string;
  /** Decorative glow colour, as a raw CSS colour. */
  glow: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    eyebrow: "Winter Collection 2026",
    title: "Winters worth",
    accent: "layering up for",
    body: "Fleece-lined hoodies, puffer jackets, heavyweight tees and co-ord sets — stitched for Indian winters, priced without the markup. Pay online or cash on delivery.",
    primary: { label: "Shop winterwear", href: "/product-page" },
    secondary: { label: "Talk to us", href: "/#support" },
    gradient: "from-[#0b2b23] via-[#143c30] to-[#0b2b23]",
    glow: "#f97316",
  },
  {
    eyebrow: "Deal of the Day",
    title: "Up to 40% off on",
    accent: "today's warmest picks",
    body: "Real discounts on hoodies, jackets, knitwear and denim — refreshed daily, while stocks last. No inflated MRP, no fake sale.",
    primary: { label: "See today's deals", href: "/#deals" },
    secondary: { label: "Browse the catalogue", href: "/product-page" },
    gradient: "from-[#0e2f27] via-[#173f34] to-[#0b2b23]",
    glow: "#fb923c",
  },
  {
    eyebrow: "Gifting & Bulk",
    title: "Gifting the season,",
    accent: "or dressing a whole team?",
    body: "Gift wrapping with handwritten notes, plus bulk pricing and custom prints for corporate teams and events. Tell us what you need and we will quote it the same working day.",
    primary: { label: "Request a quote", href: "/#support" },
    secondary: { label: "See what we offer", href: "/#services" },
    gradient: "from-[#12352c] via-[#0e2f27] to-[#081f1a]",
    glow: "#f97316",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   TRUST / VALUE PROPS
   ────────────────────────────────────────────────────────────────────────── */

export const VALUE_PROPS = SITE.highlights.map((item, index) => ({
  ...item,
  icon: ["Truck", "Banknote", "RefreshCcw", "Headphones"][index] as
    | "Truck"
    | "Banknote"
    | "RefreshCcw"
    | "Headphones",
}));

/* ──────────────────────────────────────────────────────────────────────────
   CATEGORY TILES
   ────────────────────────────────────────────────────────────────────────── */

export type CategoryTile = {
  label: string;
  href: string;
  icon:
    | "Shirt"
    | "Flame"
    | "Snowflake"
    | "Layers"
    | "ShoppingBag"
    | "Tag"
    | "Wind"
    | "Sparkles";
  blurb: string;
};

export const CATEGORY_TILES: CategoryTile[] = [
  { label: "T-Shirts", href: "/product-page?category=T-Shirts", icon: "Shirt", blurb: "Heavyweight & oversized" },
  { label: "Hoodies", href: "/product-page?category=Hoodies", icon: "Flame", blurb: "Fleece-lined warmth" },
  { label: "Jackets", href: "/product-page?category=Jackets", icon: "Snowflake", blurb: "Windproof & puffers" },
  { label: "Sweaters", href: "/product-page?category=Sweaters", icon: "Layers", blurb: "Knitwear & cardigans" },
  { label: "Jeans", href: "/product-page?category=Jeans", icon: "ShoppingBag", blurb: "Selvedge & relaxed" },
  { label: "Shirts", href: "/product-page?category=Shirts", icon: "Tag", blurb: "Casual & formal" },
  { label: "Joggers", href: "/product-page?category=Joggers", icon: "Wind", blurb: "Everyday & cargo" },
  { label: "Co-ord Sets", href: "/product-page?category=Co-ord%20Sets", icon: "Sparkles", blurb: "Ready-made matches" },
];

/* ──────────────────────────────────────────────────────────────────────────
   SOLUTIONS & SERVICES
   ────────────────────────────────────────────────────────────────────────── */

export type Solution = {
  title: string;
  desc: string;
  includes: string[];
  icon: "Home" | "Gift" | "Briefcase" | "Layers" | "GraduationCap" | "Sparkles";
};

export const SOLUTIONS: Solution[] = [
  {
    title: "Everyday Winter",
    desc: "The fleece-lined hoodie, the heavyweight tee and the joggers you actually reach for — warm, easy and unreasonably comfortable.",
    includes: ["Hoodies & sweatshirts", "Heavyweight tees", "Joggers & trackpants", "30-day size exchange"],
    icon: "Home",
  },
  {
    title: "The Gift Guide",
    desc: "Ready-to-ship winter picks with ribbon packing and a handwritten note — for birthdays, anniversaries and festivals.",
    includes: ["Gift wrapping", "Handwritten notes", "Combined shipping", "No-questions exchange"],
    icon: "Gift",
  },
  {
    title: "Corporate & Bulk",
    desc: "Logo tees, jackets and caps for teams, events and offsites — one invoice, pan-India dispatch, sizes for every body.",
    includes: ["Bulk pricing", "Custom prints & embroidery", "GST invoice", "Pan-India dispatch"],
    icon: "Briefcase",
  },
  {
    title: "Co-ord Sets",
    desc: "Matching top-and-bottom sets cut together, so the outfit is decided before you open the box.",
    includes: ["Matching sets", "Co-ordinated sizing", "One-box delivery", "Mix & match pieces"],
    icon: "Layers",
  },
  {
    title: "Students & Campus",
    desc: "Hoodies, jackets and tees priced for campus life — with cash on delivery and easy exchanges.",
    includes: ["Campus-friendly prices", "COD available", "Oversized fits", "Easy 30-day exchange"],
    icon: "GraduationCap",
  },
  {
    title: "Festive & Parties",
    desc: "Knit sweaters, overshirts and sharper winter fits for parties, dinners and family gatherings.",
    includes: ["Knitwear & overshirts", "Festive colours", "Gift wrapping", "Fast dispatch"],
    icon: "Sparkles",
  },
];

export type Service = {
  title: string;
  desc: string;
  icon: "RefreshCcw" | "Sparkles" | "Ruler" | "Truck" | "Shirt" | "LifeBuoy";
};

export const SERVICES: Service[] = [
  {
    title: "30-Day Size Exchange",
    desc: "Wrong size or changed your mind? Exchange unwashed, unworn pieces within 30 days — we arrange the pickup.",
    icon: "RefreshCcw",
  },
  {
    title: "Gift Wrapping & Notes",
    desc: "Premium ribbon packing with a handwritten note at checkout — free on orders above ₹1,999.",
    icon: "Sparkles",
  },
  {
    title: "Size & Fit Help",
    desc: "Between sizes or unsure about the fit? Our team helps you pick right before you order.",
    icon: "Ruler",
  },
  {
    title: "Pan-India Delivery",
    desc: "Dispatch in 24–48 hours, free delivery over ₹1,999, and cash on delivery across India.",
    icon: "Truck",
  },
  {
    title: "Care That Lasts",
    desc: "Every order ships with a printed care guide — wash less, wash cold, skip the tumble dry.",
    icon: "Shirt",
  },
  {
    title: "24/7 Human Support",
    desc: "Real people on WhatsApp and phone, 10am to 7pm, seven days a week. No bots, no queues.",
    icon: "LifeBuoy",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   TESTIMONIALS
   ────────────────────────────────────────────────────────────────────────── */

export const TESTIMONIALS = [
  {
    quote:
      "The fleece-lined hoodie arrived in two days and the fabric feels properly dense — easily my best winter buy so far.",
    name: "Priya Nair",
    role: "Regular customer",
    location: "Ranchi, Jharkhand",
  },
  {
    quote:
      "Ordered matching co-ord sets for our society's winter dinner. The bulk pricing and the single GST invoice made it painless.",
    name: "Anand Kumar",
    role: "Society secretary",
    location: "Dhanbad, Jharkhand",
  },
  {
    quote:
      "Size exchange was actually painless — they picked up the bigger size the same day I messaged them on WhatsApp.",
    name: "Sneha Iyer",
    role: "Customer",
    location: "Jamshedpur, Jharkhand",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   FALLBACK CATALOGUE
   ────────────────────────────────────────────────────────────────────────── */

/** Builds a fallback `Product` with sensible defaults so tiles below stay short. */
function fallback(over: Partial<Product> & Pick<Product, "name" | "slug" | "price">): Product {
  const mrp = over.mrp ?? Math.round(over.price * 1.4);
  return {
    id: 0,
    name: over.name,
    slug: over.slug,
    category: over.category ?? "T-Shirts",
    brand: "Pango",
    price: over.price,
    mrp,
    image_url: over.image_url ?? null,
    images: [],
    description_intro: over.description_intro ?? "",
    specifications: {},
    coupon: null,
    badge: over.badge ?? "",
    rating: over.rating ?? 4.5,
    review_count: over.review_count ?? 0,
    stock: over.stock ?? 25,
    inStock: true,
    discount: mrp > over.price ? Math.round(((mrp - over.price) / mrp) * 100) : null,
    is_featured: over.is_featured ?? true,
    is_deal: over.is_deal ?? false,
    deal_ends_at: over.deal_ends_at ?? null,
    bundle_slugs: over.bundle_slugs ?? [],
    created_at: "",
  };
}

const IMG = {
  hoodie1:
    "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&auto=format&fit=crop&q=80",
  hoodie2:
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=80",
  tee1:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80",
  tee2:
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80",
  jeans1:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80",
  jeans2:
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80",
  woman1:
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80",
  woman2:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78c?w=900&auto=format&fit=crop&q=80",
  womanCoat:
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80",
  womanTee:
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80",
  rack:
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80",
  shop:
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80",
};

export const FALLBACK_CATALOGUE: Product[] = [
  fallback({ name: "Pango Essential Oversized Hoodie — Men", slug: "pango-essential-oversized-hoodie-men", category: "Hoodies", price: 1499, mrp: 2499, badge: "Best Seller", rating: 4.7, review_count: 2140, image_url: IMG.hoodie1, is_deal: true, bundle_slugs: ["pango-heavyweight-pocket-tee", "pango-selvedge-denim"] }),
  fallback({ name: "Pango Fleece Zip-Up Hoodie — Men", slug: "pango-fleece-zip-up-hoodie-men", category: "Hoodies", price: 1899, mrp: 3299, badge: "Featured", rating: 4.6, review_count: 1180, image_url: IMG.hoodie2, bundle_slugs: ["pango-classic-sweatshirt"] }),
  fallback({ name: "Pango Classic Crew Sweatshirt — Men", slug: "pango-classic-crew-sweatshirt-men", category: "Sweatshirts", price: 1299, mrp: 2199, badge: "Popular", rating: 4.5, review_count: 1640, image_url: IMG.rack, is_deal: true, bundle_slugs: ["pango-relaxed-cargo-joggers-men"] }),
  fallback({ name: "Pango Storm Windcheater Jacket — Men", slug: "pango-storm-windcheater-jacket-men", category: "Jackets", price: 2499, mrp: 4499, badge: "Best Seller", rating: 4.8, review_count: 930, image_url: IMG.shop, is_deal: true, bundle_slugs: ["pango-essential-oversized-hoodie-men"] }),
  fallback({ name: "Pango Alpine Puffer Jacket — Men", slug: "pango-alpine-puffer-jacket-men", category: "Jackets", price: 4999, mrp: 8999, badge: "Premium", rating: 4.9, review_count: 640, image_url: IMG.womanCoat }),
  fallback({ name: "Pango Everyday Graphic Tee — Men", slug: "pango-everyday-graphic-tee-men", category: "T-Shirts", price: 599, mrp: 999, badge: "Popular", rating: 4.4, review_count: 3210, image_url: IMG.tee1 }),
  fallback({ name: "Pango Heavyweight Pocket Tee", slug: "pango-heavyweight-pocket-tee", category: "T-Shirts", price: 749, mrp: 1299, rating: 4.6, review_count: 1875, image_url: IMG.tee2 }),
  fallback({ name: "Pango Oxford Casual Shirt — Men", slug: "pango-oxford-casual-shirt-men", category: "Shirts", price: 1199, mrp: 1999, badge: "Featured", rating: 4.5, review_count: 940, image_url: IMG.tee1, bundle_slugs: ["pango-relaxed-cargo-joggers-men"] }),
  fallback({ name: "Pango Selvedge Denim — Men", slug: "pango-selvedge-denim-men", category: "Jeans", price: 1999, mrp: 3499, badge: "Best Seller", rating: 4.7, review_count: 2760, image_url: IMG.jeans1, is_deal: true }),
  fallback({ name: "Pango Relaxed Cargo Joggers — Men", slug: "pango-relaxed-cargo-joggers-men", category: "Joggers", price: 1399, mrp: 2299, rating: 4.5, review_count: 1520, image_url: IMG.jeans2 }),
  fallback({ name: "Pango Everyday Trackpants — Men", slug: "pango-everyday-trackpants-men", category: "Trackpants", price: 999, mrp: 1699, rating: 4.3, review_count: 1180, image_url: IMG.jeans2 }),
  fallback({ name: "Pango Wool-Blend Sweater — Men", slug: "pango-wool-blend-sweater-men", category: "Sweaters", price: 1899, mrp: 3499, badge: "Featured", rating: 4.7, review_count: 720, image_url: IMG.woman1 }),
  fallback({ name: "Pango Boyfriend Tee — Women", slug: "pango-boyfriend-tee-women", category: "T-Shirts", price: 599, mrp: 999, badge: "Popular", rating: 4.6, review_count: 2440, image_url: IMG.womanTee, is_deal: true }),
  fallback({ name: "Pango Essential Hoodie — Women", slug: "pango-essential-hoodie-women", category: "Hoodies", price: 1499, mrp: 2499, badge: "Best Seller", rating: 4.8, review_count: 2010, image_url: IMG.woman2, is_deal: true, bundle_slugs: ["pango-high-rise-jeans-women"] }),
  fallback({ name: "Pango Alpine Puffer Jacket — Women", slug: "pango-alpine-puffer-jacket-women", category: "Jackets", price: 3999, mrp: 7499, badge: "Premium", rating: 4.9, review_count: 580, image_url: IMG.womanCoat, is_deal: true }),
  fallback({ name: "Pango Windcheater — Women", slug: "pango-windcheater-women", category: "Jackets", price: 2299, mrp: 3999, rating: 4.6, review_count: 760, image_url: IMG.woman1 }),
  fallback({ name: "Pango Studio Co-ord Set — Women", slug: "pango-studio-coord-set-women", category: "Co-ord Sets", price: 1799, mrp: 2999, badge: "Featured", rating: 4.7, review_count: 1320, image_url: IMG.woman2, is_deal: true }),
  fallback({ name: "Pango Knit Sweater — Women", slug: "pango-knit-sweater-women", category: "Sweaters", price: 1699, mrp: 2999, rating: 4.6, review_count: 890, image_url: IMG.woman1 }),
  fallback({ name: "Pango High-Rise Jeans — Women", slug: "pango-high-rise-jeans-women", category: "Jeans", price: 1899, mrp: 3299, rating: 4.5, review_count: 1740, image_url: IMG.woman2 }),
  fallback({ name: "Pango Wide-Leg Trousers — Women", slug: "pango-wide-leg-trousers-women", category: "Trousers & Pants", price: 1699, mrp: 2799, rating: 4.4, review_count: 980, image_url: IMG.womanCoat, is_deal: true }),
  fallback({ name: "Pango Men Essential Tee — Multipack", slug: "pango-men-essential-tee-multipack", category: "T-Shirts", price: 1499, mrp: 2499, badge: "Popular", rating: 4.6, review_count: 2650, image_url: IMG.tee2 }),
  fallback({ name: "Pango Half-Zip Sweatshirt — Men", slug: "pango-half-zip-sweatshirt-men", category: "Sweatshirts", price: 1599, mrp: 2599, rating: 4.6, review_count: 1430, image_url: IMG.rack, is_deal: true }),
  fallback({ name: "Pango Slim Chinos — Men", slug: "pango-slim-chinos-men", category: "Trousers & Pants", price: 1699, mrp: 2799, rating: 4.5, review_count: 1120, image_url: IMG.jeans1 }),
  fallback({ name: "Pango Plaid Overshirt — Men", slug: "pango-plaid-overshirt-men", category: "Shirts", price: 1499, mrp: 2599, badge: "New", rating: 4.7, review_count: 690, image_url: IMG.tee1, is_deal: true }),
  fallback({ name: "Pango Women Cropped Hoodie", slug: "pango-women-cropped-hoodie", category: "Hoodies", price: 1299, mrp: 2199, badge: "New", rating: 4.6, review_count: 870, image_url: IMG.womanTee }),
];
