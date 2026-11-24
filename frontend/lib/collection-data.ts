/**
 * Admin-managed catalogue collections: new arrivals and winterwear.
 *
 * Mirrored into frontend/lib/collection-data.ts (types + defaults). The backend
 * owns persistence via a local file so each collection is editable without SQL.
 */

export type CollectionKey = "new-arrivals" | "winterwear";

export type CollectionSpecSection = {
  title: string;
  items: { key: string; value: string }[];
};

export type CollectionItem = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  badge: string;
  price: number;
  mrp: number;
  image: string;
  images: string[];
  description: string;
  colors: string[];
  sizes: string[];
  specs: Record<string, string>;
  specSections?: CollectionSpecSection[];
  insights: { caption: string; title: string; image: string }[];
  active: boolean;
};

export type CollectionCoupon = {
  code: string;
  label: string;
  description: string;
  minOrder: number;
  value: number;
  kind: "flat" | "percent";
  active: boolean;
};

export type CollectionFaq = { q: string; a: string };

export type CollectionData = {
  items: CollectionItem[];
  coupon: CollectionCoupon;
  insights: { caption: string; title: string; image: string }[];
  collection: {
    heading: string;
    description: string;
    faqHeading: string;
    faqs: CollectionFaq[];
  };
};

const IMG = "https://images.unsplash.com/photo-";
const img = (id: string) => `${IMG}${id}?w=900&auto=format&fit=crop&q=80`;

const COLORS = ["Black", "Blue", "Brown", "Green", "Grey", "Maroon", "White"];
const SIZES = ["S", "M", "L", "XL", "XXL"];

export const COLLECTION_KEYS: CollectionKey[] = ["new-arrivals", "winterwear"];

export const DEFAULT_COLLECTIONS: Record<CollectionKey, CollectionData> = {
  "new-arrivals": {
    items: [
    ],
    coupon: { code: "NEW150", label: "Get flat ₹150 OFF", description: "Valid on new arrivals above ₹999 · prepaid only", minOrder: 999, value: 150, kind: "flat", active: false },
    insights: [],
    collection: {
      heading: "New Arrivals",
      description: "The latest drops, fresh off the line. Be the first to wear the new season.",
      faqHeading: "New Arrivals FAQs",
      faqs: [
        { q: "How often do you add new styles?", a: "New pieces are added every week — check back often." },
        { q: "Do new arrivals come with a coupon?", a: "Yes, apply the active coupon on the product page for an instant discount." },
      ],
    },
  },
  winterwear: {
    items: [
    ],
    coupon: { code: "WINTER250", label: "Get flat ₹250 OFF", description: "Valid on winterwear above ₹1,499 · prepaid only", minOrder: 1499, value: 250, kind: "flat", active: false },
    insights: [],
    collection: {
      heading: "Winterwear Collection",
      description: "Layers built for the cold — from lightweight puffers to heavyweight fleece.",
      faqHeading: "Winterwear FAQs",
      faqs: [
        { q: "How do I pick the right layer?", a: "Start with a base layer, add a hoodie or sweater, then finish with a jacket." },
        { q: "Can I apply a coupon on winterwear?", a: "Yes — the active coupon on each product page applies instantly." },
      ],
    },
  },
};

const str = (v: unknown, fallback: string, max = 500) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || fallback;
};
const num = (v: unknown) => Math.max(0, Number(v) || 0);
const list = (v: unknown) => Array.isArray(v) ? v.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 30) : [];

const sectionsFromSpecs = (specs: Record<string, string>): CollectionSpecSection[] => [
  { title: "PRODUCT DETAILS", items: Object.entries(specs).map(([key, value]) => ({ key, value })) },
];

export function mergeCollectionData(value: unknown, key: CollectionKey): CollectionData {
  const fallback = DEFAULT_COLLECTIONS[key];
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

  const items = Array.isArray(raw.items)
    ? raw.items
        .map((entry) => {
          const c = (entry ?? {}) as Record<string, unknown>;
          const slug = str(c.slug, "", 200);
          if (!slug) return null;
          const specSections: CollectionSpecSection[] = Array.isArray(c.specSections)
            ? c.specSections
                .map((s) => {
                  const section = (s ?? {}) as Record<string, unknown>;
                  return {
                    title: str(section.title, "", 80),
                    items: Array.isArray(section.items)
                      ? section.items.map((i) => {
                          const item = (i ?? {}) as Record<string, unknown>;
                          return { key: str(item.key, "", 80), value: str(item.value, "", 300) };
                        }).filter((i) => i.key).slice(0, 40)
                      : [],
                  } as CollectionSpecSection;
                })
                .filter((s) => s.title || s.items.length)
                .slice(0, 20)
            : [];
          const specs: Record<string, string> = {};
          if (specSections.length > 0) {
            for (const section of specSections) for (const item of section.items) specs[item.key] = item.value;
          } else if (c.specs && typeof c.specs === "object") {
            for (const [k, v] of Object.entries(c.specs as Record<string, unknown>)) specs[k] = String(v ?? "");
          }
          return {
            slug,
            name: str(c.name, slug, 200),
            brand: str(c.brand, "Pango", 100),
            category: str(c.category, "General", 100),
            badge: str(c.badge, "", 60),
            price: num(c.price),
            mrp: num(c.mrp),
            image: str(c.image, "", 500),
            images: list(c.images).slice(0, 12),
            description: str(c.description, "", 3000),
            colors: list(c.colors),
            sizes: list(c.sizes),
            specs,
            specSections: specSections.length > 0 ? specSections : sectionsFromSpecs(specs),
            insights: Array.isArray(c.insights)
              ? c.insights.map((i) => {
                  const o = (i ?? {}) as Record<string, unknown>;
                  return { caption: str(o.caption, "", 80), title: str(o.title, "", 80), image: str(o.image, "", 500) };
                }).filter((i) => i.image).slice(0, 6)
              : [],
            active: c.active !== false,
          } as CollectionItem;
        })
        .filter((c): c is CollectionItem => Boolean(c))
        .slice(0, 60)
    : structuredClone(fallback.items);

  const couponRaw = (raw.coupon ?? {}) as Record<string, unknown>;
  const coupon: CollectionCoupon = {
    code: str(couponRaw.code, fallback.coupon.code, 40).toUpperCase(),
    label: str(couponRaw.label, fallback.coupon.label, 120),
    description: str(couponRaw.description, fallback.coupon.description, 250),
    minOrder: num(couponRaw.minOrder ?? fallback.coupon.minOrder),
    value: num(couponRaw.value ?? fallback.coupon.value),
    kind: couponRaw.kind === "percent" ? "percent" : "flat",
    active: couponRaw.active === undefined ? fallback.coupon.active : couponRaw.active === true,
  };

  const insights = Array.isArray(raw.insights)
    ? raw.insights.map((i) => {
        const o = (i ?? {}) as Record<string, unknown>;
        return { caption: str(o.caption, "", 80), title: str(o.title, "", 80), image: str(o.image, "", 500) };
      }).filter((i) => i.image).slice(0, 6)
    : [];

  const c = (raw.collection ?? {}) as Record<string, unknown>;
  const faqs = Array.isArray(c.faqs)
    ? c.faqs.map((f) => {
        const o = (f ?? {}) as Record<string, unknown>;
        return { q: str(o.q, "", 200), a: str(o.a, "", 1200) };
      }).filter((f) => f.q).slice(0, 30)
    : fallback.collection.faqs;

  return {
    items,
    coupon,
    insights: insights.length > 0 ? insights : structuredClone(fallback.insights),
    collection: {
      heading: str(c.heading, fallback.collection.heading, 200),
      description: str(c.description, fallback.collection.description, 4000),
      faqHeading: str(c.faqHeading, fallback.collection.faqHeading, 200),
      faqs,
    },
  };
}
