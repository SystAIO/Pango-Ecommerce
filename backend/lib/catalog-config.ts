/**
 * Admin-editable catalogue configuration: filter groups, sort options and the
 * collection copy/FAQ block at the bottom of the product listing page.
 *
 * Mirrored into frontend/lib/catalog-config.ts (defaults + types only). This
 * backend copy additionally owns persistence: Supabase first, local file
 * fallback so a fresh checkout is editable without applying SQL.
 */

export type FilterGroup = {
  key: string;
  label: string;
  enabled: boolean;
  /** Empty = derive the visible options from the live catalogue. */
  options: string[];
};

export type CatalogFaq = { q: string; a: string };
export type Coupon = {
  code: string;
  label: string;
  description: string;
  minOrder: number;
  /** Amount off in rupees, or percentage off when kind is "percent". */
  value: number;
  kind: "flat" | "percent";
  active: boolean;
};
export type SizeGuideRow = {
  size: string;
  chest: string;
  waist: string;
  length: string;
  shoulder: string;
  sleeve: string;
};

export type CatalogConfig = {
  groups: FilterGroup[];
  sortOptions: string[];
  sizeGuide: SizeGuideRow[];
  sizeGuideHowTo: string;
  coupons: Coupon[];
  collection: {
    heading: string;
    description: string;
    faqHeading: string;
    faqs: CatalogFaq[];
  };
};

export const DEFAULT_CATALOG_CONFIG: CatalogConfig = {
  groups: [
    { key: "color", label: "Color", enabled: true, options: ["Black", "Blue", "Brown", "Green", "Grey", "Maroon"] },
    { key: "size", label: "Size", enabled: true, options: ["S", "M", "L", "XL", "XXL", "XXXL"] },
    { key: "category", label: "Categories", enabled: true, options: [] },
    { key: "pattern", label: "Patterns", enabled: true, options: ["Plain", "Polo"] },
    { key: "fabric", label: "Fabric", enabled: true, options: ["Cotton", "Imported Poly", "Pique Cotton"] },
    { key: "neck", label: "Neck/Collar", enabled: true, options: ["Polo", "Round Neck"] },
    { key: "sleeves", label: "Sleeves", enabled: true, options: ["Full Sleeves", "Half Sleeves"] },
    { key: "fit", label: "Fit", enabled: true, options: ["Regular Fit"] },
    { key: "occasion", label: "Occasions", enabled: true, options: ["Casual Wear", "Semi Formal Wear"] },
    { key: "combo", label: "Combos", enabled: true, options: ["Pack Of 2", "Pick Any 2", "Pick Any 3", "Pick Any 4"] },
    {
      key: "price",
      label: "Price Range",
      enabled: true,
      options: ["Rs. 299 – Rs. 499", "Rs. 800 – Rs. 999", "Rs. 1000 – Rs. 1499", "Rs. 1500 & above"],
    },
  ],
  sortOptions: [
    "Recommended",
    "Alphabetically, A-Z",
    "Alphabetically, Z-A",
    "Price, low to high",
    "Price, high to low",
    "Date, old to new",
    "Date, new to old",
  ],
  sizeGuide: [
    { size: "M", chest: "43", waist: '30–32"', length: "26", shoulder: "17", sleeve: "24.5" },
    { size: "L", chest: "45", waist: '32–34"', length: "27", shoulder: "18", sleeve: "25" },
    { size: "XL", chest: "47", waist: '34–36"', length: "28", shoulder: "19", sleeve: "25.5" },
    { size: "2XL", chest: "49", waist: '36–38"', length: "29", shoulder: "20", sleeve: "26" },
  ],
  sizeGuideHowTo:
    "Not sure about your size? Measure a jacket you already own: chest across the fullest part, length from shoulder to hem, shoulder seam to seam, and sleeve from the shoulder to the cuff.",
  coupons: [
    {
      code: "FLASH250",
      label: "Get flat ₹250 OFF",
      description: "Valid on orders above ₹1,999 · prepaid only",
      minOrder: 1999,
      value: 250,
      kind: "flat",
      active: true,
    },
  ],
  collection: {
    heading: "Men's Collection",
    description:
      "Everyday essentials built for comfort and style. Explore the full range and find your fit.",
    faqHeading: "Frequently Asked Questions",
    faqs: [
      { q: "How do I choose the right size?", a: "Use the size guide on each product page or contact us for help." },
      { q: "What is your return policy?", a: "7-day easy returns and exchange on eligible products." },
    ],
  },
};

const str = (v: unknown, fallback: string, max = 500) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || fallback;
};

export function mergeCatalogConfig(value: unknown): CatalogConfig {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const defaults = DEFAULT_CATALOG_CONFIG;

  const groups = Array.isArray(raw.groups)
    ? raw.groups
        .map((item) => {
          const g = (item ?? {}) as Record<string, unknown>;
          const key = str(g.key, "");
          if (!key) return null;
          return {
            key,
            label: str(g.label, key, 60),
            enabled: typeof g.enabled === "boolean" ? g.enabled : true,
            options: Array.isArray(g.options)
              ? g.options.map((o) => String(o ?? "").trim().slice(0, 80)).filter(Boolean).slice(0, 40)
              : [],
          } as FilterGroup;
        })
        .filter((g): g is FilterGroup => Boolean(g))
        .slice(0, 20)
    : [];

  const sortOptions = Array.isArray(raw.sortOptions)
    ? raw.sortOptions.map((s) => String(s ?? "").trim().slice(0, 60)).filter(Boolean).slice(0, 12)
    : defaults.sortOptions;

  const c = (raw.collection ?? {}) as Record<string, unknown>;
  const faqs = Array.isArray(c.faqs)
    ? c.faqs
        .map((item) => {
          const f = (item ?? {}) as Record<string, unknown>;
          return { q: str(f.q, "", 200), a: str(f.a, "", 1200) };
        })
        .filter((f) => f.q)
        .slice(0, 30)
    : defaults.collection.faqs;

  const sizeGuide = Array.isArray(raw.sizeGuide)
    ? raw.sizeGuide
        .map((item) => {
          const s = (item ?? {}) as Record<string, unknown>;
          return {
            size: str(s.size, "", 20),
            chest: str(s.chest, "", 40),
            waist: str(s.waist, "", 40),
            length: str(s.length, "", 40),
            shoulder: str(s.shoulder, "", 40),
            sleeve: str(s.sleeve, "", 40),
          } as SizeGuideRow;
        })
        .filter((row) => row.size)
        .slice(0, 20)
    : [];

  const coupons = Array.isArray(raw.coupons)
    ? raw.coupons
        .map((item) => {
          const c = (item ?? {}) as Record<string, unknown>;
          return {
            code: str(c.code, "", 40).toUpperCase(),
            label: str(c.label, "", 120),
            description: str(c.description, "", 250),
            minOrder: Math.max(0, Number(c.minOrder) || 0),
            value: Math.max(0, Number(c.value) || 0),
            kind: c.kind === "percent" ? "percent" : "flat",
            active: c.active !== false,
          } as Coupon;
        })
        .filter((c) => c.code && c.value > 0)
        .slice(0, 20)
    : [];

  return {
    groups: groups.length > 0 ? groups : structuredClone(defaults.groups),
    sortOptions: sortOptions.length > 0 ? sortOptions : [...defaults.sortOptions],
    sizeGuide: sizeGuide.length > 0 ? sizeGuide : structuredClone(defaults.sizeGuide),
    sizeGuideHowTo: str(raw.sizeGuideHowTo, defaults.sizeGuideHowTo, 2000),
    coupons: coupons.length > 0 ? coupons : structuredClone(defaults.coupons),
    collection: {
      heading: str(c.heading, defaults.collection.heading, 200),
      description: str(c.description, defaults.collection.description, 4000),
      faqHeading: str(c.faqHeading, defaults.collection.faqHeading, 200),
      faqs,
    },
  };
}
